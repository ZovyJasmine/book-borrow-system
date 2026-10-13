/**
 * 服务启动入口
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const app = require('./app');

const port = Number(process.env.PORT || 3000);

app.listen(port, () => {
  console.log(`图书借阅系统-后台管理 已启动：http://localhost:${port}`);
});
