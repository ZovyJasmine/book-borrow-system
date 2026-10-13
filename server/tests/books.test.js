/**
 * 图书管理接口回归测试
 * 使用 Node.js 内置 node:test + fetch，测试前自动重建独立测试库，避免影响开发库数据。
 */
const TEST_DB_NAME = process.env.TEST_DB_NAME || 'book_backend_manage_test';
// 必须在本文件 require 应用之前设置，配置模块会在加载时读取该变量
process.env.DB_NAME = TEST_DB_NAME;

const { test, before, after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

const app = require('../src/app');
const { pool } = require('../src/config/db');

let server;
let baseUrl;

const jsonHeaders = { 'Content-Type': 'application/json' };

/** 执行 db/schema.sql，重建测试库结构与测试数据 */
async function initTestDatabase() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    const schema = fs
      .readFileSync(path.resolve(__dirname, '../../db/schema.sql'), 'utf8')
      .replaceAll('book_backend_manage', TEST_DB_NAME);
    await conn.query(schema);
  } finally {
    await conn.end();
  }
}

before(async () => {
  await initTestDatabase();
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  // 关闭 HTTP 服务与数据库连接池，否则连接池的空闲连接会阻止测试进程退出
  server.close();
  await pool.end();
});

test('GET /api/book-types 返回 8 种图书类型', async () => {
  const res = await fetch(`${baseUrl}/api/book-types`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.success, true);
  assert.strictEqual(body.data.length, 8);
  assert.strictEqual(body.data[0].typeName, '小说');
});

test('GET /api/books 默认每页 5 条并按入库时间降序', async () => {
  const res = await fetch(`${baseUrl}/api/books`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.data.total, 8);
  assert.strictEqual(body.data.pageSize, 5);
  assert.strictEqual(body.data.totalPages, 2);
  assert.strictEqual(body.data.list.length, 5);

  // 第一页应与参考图一致：最新入库的排在最前
  assert.strictEqual(body.data.list[0].bookName, '企业应用架构模式');
  assert.strictEqual(body.data.list[0].bookTypeName, '科技');
  assert.strictEqual(body.data.list[0].borrowedText, '未借阅');
  // 入库时间按「年-月-日」返回
  assert.strictEqual(body.data.list[0].creationTimeText, '2014-07-03');

  // 整个列表按 creationTime 降序
  const times = body.data.list.map((item) => item.creationTime);
  assert.deepStrictEqual(times, [...times].sort().reverse());
});

test('GET /api/books?page=2 返回第二页 3 条数据', async () => {
  const res = await fetch(`${baseUrl}/api/books?page=2`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.data.page, 2);
  assert.strictEqual(body.data.list.length, 3);
});

test('GET /api/books?name=天龙 按图书名称模糊查询', async () => {
  const res = await fetch(`${baseUrl}/api/books?name=${encodeURIComponent('天龙')}`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.data.total, 1);
  assert.strictEqual(body.data.list[0].bookCode, 'BK000025');
  assert.strictEqual(body.data.list[0].bookName, '天龙八部');
});

test('GET /api/books/:id 返回图书详细信息', async () => {
  const res = await fetch(`${baseUrl}/api/books/3`);
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.data.bookCode, 'BK000025');
  assert.strictEqual(body.data.bookName, '天龙八部');
  assert.strictEqual(body.data.bookTypeName, '小说');
  assert.strictEqual(body.data.bookAuthor, '金庸');
  assert.strictEqual(body.data.publishPress, '中原出版社');
  assert.strictEqual(body.data.createdBy, '系统管理员');
  assert.strictEqual(body.data.creationTimeText, '2014-03-12');
});

test('GET /api/books/99999 图书不存在时返回 404', async () => {
  const res = await fetch(`${baseUrl}/api/books/99999`);
  const body = await res.json();

  assert.strictEqual(res.status, 404);
  assert.strictEqual(body.success, false);
  assert.strictEqual(body.message, '图书信息不存在');
});

test('POST /api/books 新增图书并应用默认值', async () => {
  const res = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      bookCode: 'BK000031',
      bookName: '测试新增图书',
      bookType: 8,
      bookAuthor: '测试作者',
      publishPress: '测试出版社',
      publishDate: '2024-01-01',
    }),
  });
  const body = await res.json();

  assert.strictEqual(res.status, 201);
  assert.strictEqual(body.message, '新增成功');
  // 默认值：是否借阅未借阅、入库人系统管理员、入库时间为当前时间
  assert.strictEqual(body.data.borrowed, 0);
  assert.strictEqual(body.data.borrowedText, '未借阅');
  assert.strictEqual(body.data.createdBy, '系统管理员');
  assert.ok(body.data.creationTimeText);

  // 新增记录入库时间为当前时间，应排在列表最前
  const list = await (await fetch(`${baseUrl}/api/books`)).json();
  assert.strictEqual(list.data.total, 9);
  assert.strictEqual(list.data.list[0].bookName, '测试新增图书');
});

test('POST /api/books 缺少必填项时返回 400', async () => {
  const res = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ bookCode: 'BK000032', bookType: 1 }),
  });
  const body = await res.json();

  assert.strictEqual(res.status, 400);
  assert.strictEqual(body.success, false);
  assert.match(body.message, /图书名称不能为空/);
});

test('POST /api/books 图书类型不存在时返回 400', async () => {
  const res = await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ bookCode: 'BK000033', bookName: '类型非法', bookType: 999 }),
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual((await res.json()).message, '图书类型不存在');
});

test('PUT /api/books/:id 修改图书且不覆盖入库人与入库时间', async () => {
  const original = await (await fetch(`${baseUrl}/api/books/3`)).json();

  const res = await fetch(`${baseUrl}/api/books/3`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({
      bookCode: 'BK000025',
      bookName: '天龙八部（修订版）',
      bookType: 1,
      bookAuthor: '金庸',
      publishPress: '中原出版社',
      publishDate: '2014-03-12',
      borrowed: 1,
      // 以下两项即便前端传了也不允许被修改
      createdBy: '入侵者',
      creationTime: '1999-01-01 00:00:00',
    }),
  });
  const body = await res.json();

  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.message, '修改成功');
  assert.strictEqual(body.data.bookName, '天龙八部（修订版）');
  assert.strictEqual(body.data.borrowed, 1);
  assert.strictEqual(body.data.borrowedText, '已借阅');
  // 入库人、入库时间保持不变
  assert.strictEqual(body.data.createdBy, original.data.createdBy);
  assert.strictEqual(body.data.creationTime, original.data.creationTime);
  // 最新更新时间被刷新
  assert.ok(body.data.lastUpdatetime);
});

test('PUT /api/books/99999 图书不存在时返回 404', async () => {
  const res = await fetch(`${baseUrl}/api/books/99999`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ bookCode: 'X', bookName: 'X', bookType: 1 }),
  });

  assert.strictEqual(res.status, 404);
});

test('DELETE /api/books/:id 删除图书', async () => {
  const created = await (await fetch(`${baseUrl}/api/books`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      bookCode: 'BK000099',
      bookName: '待删除图书',
      bookType: 1,
      publishDate: '2024-02-02',
    }),
  })).json();

  const bookId = created.data.bookId;

  const res = await fetch(`${baseUrl}/api/books/${bookId}`, { method: 'DELETE' });
  const body = await res.json();
  assert.strictEqual(res.status, 200);
  assert.strictEqual(body.message, '删除成功');

  // 再次删除应返回 404
  const again = await fetch(`${baseUrl}/api/books/${bookId}`, { method: 'DELETE' });
  assert.strictEqual(again.status, 404);
});

test('请求不存在的接口返回 404', async () => {
  const res = await fetch(`${baseUrl}/api/not-exist`);
  assert.strictEqual(res.status, 404);
  assert.strictEqual((await res.json()).message, '请求的资源不存在');
});
