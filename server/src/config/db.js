/**
 * 数据库连接配置
 * 使用 mysql2 连接池统一管理 MySQL 连接，并提供事务封装。
 */
const path = require('path');

// 载入项目根目录下的 .env（不覆盖已存在的环境变量，便于测试注入）
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const mysql = require('mysql2/promise');

// 连接池：mysql2 的连接池是「懒连接」，创建时不会真正连数据库
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'book_backend_manage',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4_general_ci',
  // 日期时间以字符串形式返回（如 2014-03-12 09:12:00），避免时区与 Date 对象带来的格式化困扰
  dateStrings: true,
});

/**
 * 事务封装：在同一个连接上执行 handler，成功提交、失败回滚。
 * 对应试卷「为业务对象添加声明式事务支持」的要求（此处以统一封装实现）。
 * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<any>} handler
 */
async function withTransaction(handler) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await handler(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = { pool, withTransaction };
