/**
 * 统一响应格式
 *   成功：{ success: true,  message, data }
 *   失败：{ success: false, message }
 */
function success(res, data = null, message = '操作成功', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function fail(res, message = '操作失败', status = 400) {
  return res.status(status).json({ success: false, message });
}

module.exports = { success, fail };
