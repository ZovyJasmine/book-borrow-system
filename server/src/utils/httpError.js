/**
 * 构造带 HTTP 状态码的错误对象，供全局异常处理中间件识别。
 * @param {number} status HTTP 状态码
 * @param {string} message 错误提示
 */
function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

module.exports = { httpError };
