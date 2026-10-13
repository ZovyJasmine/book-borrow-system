/**
 * API 路由汇总，统一挂载在 /api 下
 */
const express = require('express');

const bookTypeRoutes = require('./bookTypeRoutes');
const bookRoutes = require('./bookRoutes');

const router = express.Router();

router.use('/book-types', bookTypeRoutes);
router.use('/books', bookRoutes);

module.exports = router;
