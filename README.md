# 图书借阅系统 - 后台管理

基于 **Express + MySQL** 的图书借阅系统后台管理，前后端分离：后端提供 REST API，前端为静态页面（jQuery + Ajax）。

> 需求来源：`2016年10月学士后Java毕业考试机试试卷-2.pdf`（功能与库表设计）
> 工程技术要求来源：`quiz07.md`（技术栈、Git/GitHub 流程、Actions 回归测试）

## 技术栈

| 层次 | 技术 |
|---|---|
| 后端 | Node.js + Express 5 |
| 数据库 | MySQL 8（mysql2 连接池） |
| 前端 | 原生 HTML/CSS + jQuery 3.7.1（本地 vendor）+ Ajax |
| 测试 | Node.js 内置 `node:test` + `fetch` |
| CI | GitHub Actions（MySQL 服务容器 + Node 18/20/24 矩阵） |

## 目录结构

```
book-borrow-system/
├── .github/
│   ├── ISSUE_TEMPLATE/feature_request.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   └── workflows/ci.yml          # 回归测试工作流
├── db/
│   └── schema.sql                # 建库、建表、自增主键、测试数据
├── scripts/
│   └── init-db.js                # 执行 schema.sql 初始化数据库
├── server/
│   ├── src/
│   │   ├── config/db.js          # 连接池 + 事务封装
│   │   ├── dao/                  # 数据访问层（SQL）
│   │   ├── service/              # 业务层
│   │   ├── routes/               # 控制器（路由）
│   │   ├── middleware/           # 错误处理等中间件
│   │   ├── app.js                # Express 应用
│   │   └── server.js             # 启动入口
│   └── tests/                    # 回归测试
├── web/                          # 前端静态页面
│   ├── index.html                # 图书列表（查询、分页、增删改入口）
│   ├── detail.html               # 查看图书信息
│   ├── add.html                  # 新增图书信息
│   ├── edit.html                 # 修改图书信息
│   ├── css/style.css
│   ├── js/                       # 各页面脚本
│   └── vendor/jquery-3.7.1.min.js
├── .env.example
├── package.json
└── README.md
```

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 准备环境变量
copy .env.example .env          # Windows
# cp .env.example .env          # Linux / macOS

# 3. 初始化数据库（建库、建表、插入测试数据）
npm run init-db

# 4. 启动服务
npm start
```

打开 <http://localhost:3000/index.html> 即可进入图书列表页。

## 可用脚本

| 命令 | 说明 |
|---|---|
| `npm start` | 启动服务（默认 3000 端口） |
| `npm run dev` | 开发模式（文件变更自动重启） |
| `npm run init-db` | 重建数据库结构与测试数据 |
| `npm test` | 运行回归测试 |

## 接口一览

基址：`/api`

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/book-types` | 查询全部图书类型（下拉框数据源） |
| GET | `/api/books?name=&page=&pageSize=` | 分页查询图书，支持按名称模糊查询，按入库时间降序 |
| GET | `/api/books/:id` | 查询图书详细信息 |
| POST | `/api/books` | 新增图书 |
| PUT | `/api/books/:id` | 修改图书 |
| DELETE | `/api/books/:id` | 删除图书 |

统一响应格式：

```jsonc
// 成功
{ "success": true,  "message": "新增成功", "data": { } }
// 失败
{ "success": false, "message": "图书编号不能为空" }
```

## 数据库设计

### book_type（图书类型表）

| 字段 | 说明 | 类型 | 属性 |
|---|---|---|---|
| id | 主键 | INT | 主键、自动增长 |
| typeName | 图书类型名称 | VARCHAR(50) | 非空 |

### book_info（图书信息表）

| 字段 | 说明 | 类型 | 属性 |
|---|---|---|---|
| bookId | 图书ID | INT | 主键、自动增长 |
| bookCode | 图书编号 | VARCHAR(50) | 非空 |
| bookName | 图书名称 | VARCHAR(100) | 非空 |
| bookType | 图书类型 | INT | 非空，外键 → book_type.id |
| bookAuthor | 图书作者 | VARCHAR(100) | 非空 |
| publishPress | 出版社 | VARCHAR(100) | 非空 |
| publishDate | 出版日期 | DATE | 非空 |
| borrowed | 是否借阅 | INT | 非空（1 已借阅、0 未借阅） |
| createdBy | 创建人（入库人） | VARCHAR(50) | 非空 |
| creationTime | 创建时间（入库时间） | DATETIME | 非空 |
| lastUpdatetime | 最新更新时间 | DATETIME | 可空 |

> 说明：试卷库表设计中 `bookAuthor` 标注为「整数」，但参考图（图-1/图-3/图-6）中作者列显示的是文字
> （如「金庸」「（英）Martin Fowler」），因此实现为 `VARCHAR(100)`。

## 功能说明

1. **图书列表**：默认显示全部图书，按 `creationTime` 降序，入库时间按「年-月-日」显示，列表隔行变色，每页 5 条。
2. **模糊查询**：按图书名称模糊查询，查询条件会被记住（URL 参数 + 输入框回填），结果同样按入库时间降序。
3. **查看详情**：全部字段只读；点击「返回」回到列表，且保留原来的查询条件与页码。
4. **新增图书**：必填项（图书编号、图书名称、图书类型、是否借阅、入库人、入库时间）用 jQuery 校验；
   入库时间默认当前时间，入库人默认「系统管理员」，是否借阅默认「未借阅」；
   无论成功失败都给出提示，点击确定后回到列表页。
5. **修改图书**：字段校验同新增；「入库人」「入库时间」为只读，不可修改；结果同样有提示并回到列表页。
6. **删除图书**：删除前弹出确认框「确认删除该条图书信息！」，删除后在列表页提示成功或失败。

## 开发流程（Git / GitHub）

- 使用 `main` 作为主分支，功能开发走独立分支
- 初始化时为**前端**与**后端**分别创建 Issue
- 完成后提交 PR（描述中使用 `Closes #编号` 关联 Issue），CI 通过后合并，并删除特性分支
- `push` / `pull_request` 到 `main` 时由 GitHub Actions 自动执行回归测试
