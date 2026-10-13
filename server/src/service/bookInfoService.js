/**
 * 图书信息业务层
 * 负责：参数校验、默认值处理、业务规则、事务控制。
 */
const bookInfoDao = require('../dao/bookInfoDao');
const bookTypeDao = require('../dao/bookTypeDao');
const { withTransaction } = require('../config/db');
const { httpError } = require('../utils/httpError');
const { now, toDateText, normalizeDate, normalizeDateTime } = require('../utils/datetime');

/** 试卷要求：每页显示五条数据 */
const DEFAULT_PAGE_SIZE = 5;
/** 试卷要求：本次不实现登录功能，入库人固定为系统管理员 */
const DEFAULT_CREATED_BY = '系统管理员';
/** 试卷要求：是否借阅默认为未借阅 */
const DEFAULT_BORROWED = 0;

/** 必填项（图书编号、图书名称、图书类型、是否借阅、入库人、入库时间；后两项有默认值） */
const REQUIRED_FIELDS = [
  ['bookCode', '图书编号'],
  ['bookName', '图书名称'],
  ['bookType', '图书类型'],
];

/** 把数据库行转换为前端易用的视图对象 */
function toView(row) {
  return {
    ...row,
    creationTimeText: toDateText(row.creationTime),
    publishDateText: toDateText(row.publishDate),
    borrowedText: row.borrowed === 1 ? '已借阅' : '未借阅',
  };
}

/** 校验必填项 */
function validateRequired(payload) {
  const missing = REQUIRED_FIELDS
    .filter(([key]) => payload[key] === undefined || payload[key] === null || String(payload[key]).trim() === '')
    .map(([, label]) => label);

  if (missing.length > 0) {
    throw httpError(400, `${missing.join('、')}不能为空`);
  }
}

/** 解析是否借阅（1、已借阅；0、未借阅） */
function parseBorrowed(value) {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_BORROWED;
  }
  const num = Number(value);
  if (num !== 0 && num !== 1) {
    throw httpError(400, '是否借阅只能为 1（已借阅）或 0（未借阅）');
  }
  return num;
}

/** 校验图书类型必须来源于图书类型表 book_type */
async function ensureBookType(bookType) {
  if (!Number.isInteger(bookType)) {
    throw httpError(400, '图书类型不正确');
  }
  if (!(await bookTypeDao.existsById(bookType))) {
    throw httpError(400, '图书类型不存在');
  }
}

/** 把请求体整理成数据库需要的图书对象 */
function buildBook(payload, { base = {} } = {}) {
  return {
    bookCode: String(payload.bookCode).trim(),
    bookName: String(payload.bookName).trim(),
    bookType: Number(payload.bookType),
    bookAuthor: payload.bookAuthor ? String(payload.bookAuthor).trim() : '',
    publishPress: payload.publishPress ? String(payload.publishPress).trim() : '',
    publishDate: payload.publishDate ? normalizeDate(payload.publishDate) : (base.publishDate || normalizeDate(undefined)),
    borrowed: payload.borrowed === undefined || payload.borrowed === ''
      ? (base.borrowed ?? DEFAULT_BORROWED)
      : parseBorrowed(payload.borrowed),
  };
}

/**
 * 分页查询图书（按入库时间降序，支持名称模糊查询）
 */
async function listBooks({ name = '', page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const keyword = String(name ?? '').trim();
  const size = Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE);
  const requestedPage = Math.max(1, Number(page) || 1);

  const total = await bookInfoDao.count(keyword);
  const totalPages = Math.max(1, Math.ceil(total / size));
  const currentPage = Math.min(requestedPage, totalPages);
  const offset = (currentPage - 1) * size;

  const rows = await bookInfoDao.findPage({ name: keyword, offset, limit: size });

  return {
    total,
    page: currentPage,
    pageSize: size,
    totalPages,
    list: rows.map(toView),
  };
}

/** 查询图书详细信息 */
async function getBook(bookId) {
  const id = Number(bookId);
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, '图书ID不正确');
  }
  const row = await bookInfoDao.findById(id);
  if (!row) {
    throw httpError(404, '图书信息不存在');
  }
  return toView(row);
}

/**
 * 新增图书
 * 入库时间默认当前时间、入库人默认系统管理员、是否借阅默认未借阅
 */
async function createBook(payload) {
  validateRequired(payload);
  const bookType = Number(payload.bookType);
  await ensureBookType(bookType);

  const book = {
    ...buildBook(payload),
    createdBy: payload.createdBy && String(payload.createdBy).trim()
      ? String(payload.createdBy).trim()
      : DEFAULT_CREATED_BY,
    creationTime: normalizeDateTime(payload.creationTime),
    lastUpdatetime: null,
  };

  const bookId = await withTransaction((conn) => bookInfoDao.insert(book, conn));
  return getBook(bookId);
}

/**
 * 修改图书
 * 注意：「入库人」和「入库时间」不可修改，同时刷新「最新更新时间」
 */
async function updateBook(bookId, payload) {
  const existing = await bookInfoDao.findById(bookId);
  if (!existing) {
    throw httpError(404, '图书信息不存在');
  }

  validateRequired(payload);
  const bookType = Number(payload.bookType);
  await ensureBookType(bookType);

  const book = {
    ...buildBook(payload, { base: existing }),
    lastUpdatetime: now(),
  };

  const affected = await withTransaction((conn) => bookInfoDao.update(Number(bookId), book, conn));
  if (affected === 0) {
    throw httpError(404, '图书信息不存在');
  }
  return getBook(bookId);
}

/** 删除图书 */
async function removeBook(bookId) {
  const id = Number(bookId);
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, '图书ID不正确');
  }
  const affected = await withTransaction((conn) => bookInfoDao.remove(id, conn));
  if (affected === 0) {
    throw httpError(404, '图书信息不存在');
  }
}

module.exports = { listBooks, getBook, createBook, updateBook, removeBook, DEFAULT_PAGE_SIZE };
