/**
 * 公共工具：URL 参数、接口调用、提示信息
 * 依赖 jQuery
 */
(function (window, $) {
  'use strict';

  /** 读取地址栏参数 */
  function getQuery(name) {
    return new URLSearchParams(window.location.search).get(name) || '';
  }

  /** 当前页面文件名（不含参数） */
  function currentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  /**
   * 返回列表页的目标地址。
   * 列表页在跳转时会带上 returnUrl（包含查询条件与页码），
   * 从详情 / 新增 / 修改页返回时据此恢复原来的查询条件与结果。
   */
  function backUrl(fallback) {
    return getQuery('returnUrl') || fallback || 'index.html';
  }

  /** 今天的日期，格式：YYYY-MM-DD（新增页「入库时间」默认值） */
  function today() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  /** HTML 转义，避免后台数据中的特殊字符破坏页面结构 */
  function escapeHtml(value) {
    if (value === undefined || value === null) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /** 接口调用封装（Ajax） */
  const api = {
    get(url, data) {
      return $.ajax({ url, type: 'GET', data, dataType: 'json' });
    },
    post(url, data) {
      return $.ajax({
        url,
        type: 'POST',
        contentType: 'application/json; charset=UTF-8',
        data: JSON.stringify(data),
        dataType: 'json',
      });
    },
    put(url, data) {
      return $.ajax({
        url,
        type: 'PUT',
        contentType: 'application/json; charset=UTF-8',
        data: JSON.stringify(data),
        dataType: 'json',
      });
    },
    remove(url) {
      return $.ajax({ url, type: 'DELETE', dataType: 'json' });
    },
  };

  /** 从失败响应中取出后端返回的提示信息 */
  function errorMessage(jqXHR, fallback) {
    if (jqXHR && jqXHR.responseJSON && jqXHR.responseJSON.message) {
      return jqXHR.responseJSON.message;
    }
    return fallback || '网络异常，请稍后重试';
  }

  window.App = { getQuery, currentPage, backUrl, today, escapeHtml, api, errorMessage };
})(window, jQuery);
