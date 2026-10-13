/**
 * 图书信息表（book_info）数据访问层
 * 仅负责 SQL 执行与参数绑定，不包含业务判断。
 */
const { pool } = require('../config/db');

/** 列表 / 详情共用的查询字段（联表取回图书类型名称） */
const BASE_SELECT = `
  SELECT
    b.bookId,
    b.bookCode,
    b.bookName,
    b.bookType,
    t.typeName      AS bookTypeName,
    b.bookAuthor,
    b.publishPress,
    b.publishDate,
    b.borrowed,
    b.createdBy,
    b.creationTime,
    b.lastUpdatetime
  FROM book_info b
  LEFT JOIN book_type t ON t.id = b.bookType
`;

/**
 * 统计图书总数（支持按名称模糊查询）
 * @param {string} name 图书名称关键字，可为空
 */
async function count(name, conn = pool) {
  const params = [];
  let sql = 'SELECT COUNT(*) AS total FROM book_info b WHERE 1 = 1';
  if (name) {
    sql += ' AND b.bookName LIKE ?';
    params.push(`%${name}%`);
  }
  const [rows] = await conn.query(sql, params);
  return Number(rows[0].total);
}

/**
 * 分页查询图书，按入库时间降序（时间相同再按主键降序，保证顺序稳定）
 * @param {{name?: string, offset: number, limit: number}} options
 */
async function findPage({ name, offset, limit }, conn = pool) {
  const params = [];
  let sql = `${BASE_SELECT} WHERE 1 = 1`;
  if (name) {
    sql += ' AND b.bookName LIKE ?';
    params.push(`%${name}%`);
  }
  sql += ' ORDER BY b.creationTime DESC, b.bookId DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await conn.query(sql, params);
  return rows;
}

/**
 * 按主键查询图书详细信息
 * @param {number} bookId
 */
async function findById(bookId, conn = pool) {
  const [rows] = await conn.query(`${BASE_SELECT} WHERE b.bookId = ?`, [bookId]);
  return rows[0] || null;
}

/**
 * 新增图书，返回新记录主键
 * @param {object} book 已标准化的图书数据
 */
async function insert(book, conn = pool) {
  const sql = `
    INSERT INTO book_info
      (bookCode, bookName, bookType, bookAuthor, publishPress, publishDate, borrowed, createdBy, creationTime, lastUpdatetime)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    book.bookCode,
    book.bookName,
    book.bookType,
    book.bookAuthor,
    book.publishPress,
    book.publishDate,
    book.borrowed,
    book.createdBy,
    book.creationTime,
    book.lastUpdatetime,
  ];
  const [result] = await conn.query(sql, params);
  return result.insertId;
}

/**
 * 修改图书（入库人、入库时间不允许修改，同时刷新最新更新时间），返回受影响行数
 * @param {number} bookId
 * @param {object} book 已标准化的图书数据
 */
async function update(bookId, book, conn = pool) {
  const sql = `
    UPDATE book_info SET
      bookCode       = ?,
      bookName       = ?,
      bookType       = ?,
      bookAuthor     = ?,
      publishPress   = ?,
      publishDate    = ?,
      borrowed       = ?,
      lastUpdatetime = ?
    WHERE bookId = ?
  `;
  const params = [
    book.bookCode,
    book.bookName,
    book.bookType,
    book.bookAuthor,
    book.publishPress,
    book.publishDate,
    book.borrowed,
    book.lastUpdatetime,
    bookId,
  ];
  const [result] = await conn.query(sql, params);
  return result.affectedRows;
}

/**
 * 删除图书，返回受影响行数
 * @param {number} bookId
 */
async function remove(bookId, conn = pool) {
  const [result] = await conn.query('DELETE FROM book_info WHERE bookId = ?', [bookId]);
  return result.affectedRows;
}

module.exports = { count, findPage, findById, insert, update, remove };
