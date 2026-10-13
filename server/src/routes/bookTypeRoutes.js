/**
 * 图书类型控制器
 * GET /api/book-types  查询全部图书类型（下拉框数据源）
 */
const express = require('express');
const bookTypeService = require('../service/bookTypeService');
const { success } = require('../utils/response');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const list = await bookTypeService.listTypes();
    success(res, list, '查询成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
