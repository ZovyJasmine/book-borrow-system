/**
 * 图书信息控制器
 * GET    /api/books        分页查询（支持名称模糊查询，按入库时间降序，每页 5 条）
 * GET    /api/books/:id    图书详细信息
 * POST   /api/books        新增图书
 * PUT    /api/books/:id    修改图书
 * DELETE /api/books/:id    删除图书
 */
const express = require('express');
const bookInfoService = require('../service/bookInfoService');
const { success } = require('../utils/response');

const router = express.Router();

// 分页查询图书列表
router.get('/', async (req, res, next) => {
  try {
    const { name, page, pageSize } = req.query;
    const data = await bookInfoService.listBooks({ name, page, pageSize });
    success(res, data, '查询成功');
  } catch (err) {
    next(err);
  }
});

// 查询图书详细信息
router.get('/:id', async (req, res, next) => {
  try {
    const data = await bookInfoService.getBook(req.params.id);
    success(res, data, '查询成功');
  } catch (err) {
    next(err);
  }
});

// 新增图书
router.post('/', async (req, res, next) => {
  try {
    const data = await bookInfoService.createBook(req.body || {});
    success(res, data, '新增成功', 201);
  } catch (err) {
    next(err);
  }
});

// 修改图书
router.put('/:id', async (req, res, next) => {
  try {
    const data = await bookInfoService.updateBook(req.params.id, req.body || {});
    success(res, data, '修改成功');
  } catch (err) {
    next(err);
  }
});

// 删除图书
router.delete('/:id', async (req, res, next) => {
  try {
    await bookInfoService.removeBook(req.params.id);
    success(res, null, '删除成功');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
