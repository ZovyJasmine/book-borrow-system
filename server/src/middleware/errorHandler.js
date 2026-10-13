/**
 * 统一异常处理中间件
 * 试卷要求「操作数据库时进行必要的异常处理」，此处集中处理，避免异常裸露给前端。
 */

/** 未匹配到任何路由时返回 404 */
function notFoundHandler(req, res) {
  res.status(404).json({ success: false, message: '请求的资源不存在' });
}

/** 全局异常处理：err.status 由业务层通过 httpError 指定 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;

  if (status >= 500) {
    console.error('[服务器异常]', err);
  }

  res.status(status).json({
    success: false,
    message: status >= 500 ? '服务器内部错误，请稍后重试' : err.message,
  });
}

module.exports = { notFoundHandler, errorHandler };
