/**
 * 数据库初始化脚本
 * 读取 db/schema.sql 并在 MySQL 中执行：建库 → 建表 → 插入测试数据。
 * 用法：npm run init-db
 */
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mysql = require('mysql2/promise');

async function main() {
  const sqlFile = path.resolve(__dirname, '../db/schema.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  try {
    await conn.query(sql);
    console.log(`数据库初始化完成：${process.env.DB_NAME || 'book_backend_manage'}`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('数据库初始化失败：', err.message);
  process.exit(1);
});
