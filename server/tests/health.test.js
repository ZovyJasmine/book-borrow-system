/**
 * 健康检查回归测试
 * 使用 Node.js 内置 node:test + fetch，不引入第三方测试库。
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert');

const app = require('../src/app');

let server;
let baseUrl;

before(() => {
  server = app.listen(0); // 0 = 由系统分配空闲端口
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('GET /health 返回 ok', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(await res.json(), { status: 'ok' });
});
