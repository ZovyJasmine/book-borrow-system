/**
 * 图书类型业务层
 */
const bookTypeDao = require('../dao/bookTypeDao');

/** 查询全部图书类型（新增 / 修改页面下拉框的数据来源） */
async function listTypes() {
  return bookTypeDao.findAll();
}

module.exports = { listTypes };
