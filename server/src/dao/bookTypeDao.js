/**
 * 图书类型表（book_type）数据访问层
 */
const { pool } = require('../config/db');

/**
 * 查询全部图书类型
 * @param {import('mysql2/promise').Pool | import('mysql2/promise').PoolConnection} [conn]
 */
async function findAll(conn = pool) {
  const [rows] = await conn.query('SELECT id, typeName FROM book_type ORDER BY id ASC');
  return rows;
}

/**
 * 判断图书类型是否存在
 * @param {number} id 类型主键
 */
async function existsById(id, conn = pool) {
  const [rows] = await conn.query('SELECT id FROM book_type WHERE id = ?', [id]);
  return rows.length > 0;
}

module.exports = { findAll, existsById };
