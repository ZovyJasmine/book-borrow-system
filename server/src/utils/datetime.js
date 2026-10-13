/**
 * 日期时间格式化工具
 * 注意：数据库连接开启了 dateStrings，取出的日期均为字符串
 *   DATE     -> 'YYYY-MM-DD'
 *   DATETIME -> 'YYYY-MM-DD HH:mm:ss'
 */
const { httpError } = require('./httpError');

function pad(num) {
  return String(num).padStart(2, '0');
}

/** 当前时间，格式：YYYY-MM-DD HH:mm:ss */
function now() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 今天，格式：YYYY-MM-DD */
function today() {
  return now().slice(0, 10);
}

/** 取「年-月-日」显示文本（试卷要求入库时间按 年-月-日 显示） */
function toDateText(value) {
  if (value === undefined || value === null || value === '') return '';
  return String(value).slice(0, 10);
}

/**
 * 把前端传来的入库时间标准化为 DATETIME 字符串。
 * - 未传值：使用当前时间（试卷要求「入库时间默认为当前时间」）
 * - 只传日期：补当前时分秒，保证同日新增的记录仍按时间先后排序
 * - 传完整日期时间：原样使用
 */
function normalizeDateTime(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return now();
  }
  const text = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return `${text} ${now().slice(11)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/.test(text)) {
    return `${text.replace('T', ' ')}:00`;
  }
  if (/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(text)) {
    return text.replace('T', ' ');
  }
  throw httpError(400, '入库时间格式不正确，应为 年-月-日');
}

/** 把前端传来的出版日期标准化为 DATE 字符串，未传值时取今天 */
function normalizeDate(value) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return today();
  }
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw httpError(400, '出版日期格式不正确，应为 年-月-日');
  }
  return text;
}

module.exports = { now, today, toDateText, normalizeDateTime, normalizeDate };
