/**
 * Express 应用入口（骨架版）
 * 后续业务路由在 routes 目录中实现并挂载到 /api。
 */
const express = require('express');
const path = require('path');

const app = express();

// 解析 JSON 与表单请求体
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 健康检查接口
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 静态前端页面（web 目录）
app.use(express.static(path.resolve(__dirname, '../../web')));

module.exports = app;
