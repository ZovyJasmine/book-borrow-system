/**
 * Express 应用入口
 * 组装：请求体解析 → 健康检查 → 静态前端 → REST API → 统一异常处理
 */
const express = require('express');
const path = require('path');

const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

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

// REST API
app.use('/api', apiRoutes);

// 未匹配路由与统一异常处理（必须放在最后）
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
