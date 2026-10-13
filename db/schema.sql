-- =============================================================
-- 图书借阅系统（后台） 数据库脚本
-- 数据库：MySQL 8.x
-- 内容：创建数据库、创建表结构、创建主键（设置自动增长）、插入测试数据
-- 说明：主键按试卷要求采用「设置自动增长」方式（AUTO_INCREMENT）
-- =============================================================

-- 1. 创建数据库
CREATE DATABASE IF NOT EXISTS `book_backend_manage`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE `book_backend_manage`;

-- 2. 删除旧表（先删子表 book_info，再删父表 book_type）
DROP TABLE IF EXISTS `book_info`;
DROP TABLE IF EXISTS `book_type`;

-- =============================================================
-- 3. 图书类型表 book_type
-- =============================================================
CREATE TABLE `book_type` (
  `id`       INT         NOT NULL AUTO_INCREMENT COMMENT '主键 id',
  `typeName` VARCHAR(50) NOT NULL                COMMENT '图书类型名称',
  PRIMARY KEY (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '图书类型表';

-- =============================================================
-- 4. 图书信息表 book_info
--    字段类型按试卷「三、数据库设计」表定义
--    （bookAuthor 试卷标注为「整数」，但图-1/图-3/图-6 中作者列
--      显示的是文字，如「金庸」「（英）Martin Fowler」，故采用字符串）
-- =============================================================
CREATE TABLE `book_info` (
  `bookId`         INT           NOT NULL AUTO_INCREMENT COMMENT '图书ID',
  `bookCode`       VARCHAR(50)   NOT NULL                COMMENT '图书编号',
  `bookName`       VARCHAR(100)  NOT NULL                COMMENT '图书名称',
  `bookType`       INT           NOT NULL                COMMENT '图书类型（关联 book_type.id）',
  `bookAuthor`     VARCHAR(100)  NOT NULL DEFAULT ''     COMMENT '图书作者',
  `publishPress`   VARCHAR(100)  NOT NULL DEFAULT ''     COMMENT '出版社',
  `publishDate`    DATE          NOT NULL                COMMENT '出版日期',
  `borrowed`       INT           NOT NULL DEFAULT 0      COMMENT '是否借阅（1、已借阅 0、未借阅）',
  `createdBy`      VARCHAR(50)   NOT NULL                COMMENT '创建人（入库人）',
  `creationTime`   DATETIME      NOT NULL                COMMENT '创建时间（入库时间）',
  `lastUpdatetime` DATETIME      NULL                    COMMENT '最新更新时间',
  PRIMARY KEY (`bookId`),
  KEY `idx_book_info_creation_time` (`creationTime`),
  KEY `idx_book_info_book_name` (`bookName`),
  KEY `fk_book_info_book_type` (`bookType`),
  CONSTRAINT `fk_book_info_book_type` FOREIGN KEY (`bookType`) REFERENCES `book_type` (`id`)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '图书信息表';

-- =============================================================
-- 5. 测试数据：图书类型表（8 条，与试卷列出的类型一致）
-- =============================================================
INSERT INTO `book_type` (`id`, `typeName`) VALUES
  (1, '小说'),
  (2, '文学'),
  (3, '传记'),
  (4, '艺术'),
  (5, '少儿'),
  (6, '经济'),
  (7, '管理'),
  (8, '科技');

-- =============================================================
-- 6. 测试数据：图书信息表（8 条）
-- =============================================================
INSERT INTO `book_info`
  (`bookCode`, `bookName`, `bookType`, `bookAuthor`, `publishPress`, `publishDate`, `borrowed`, `createdBy`, `creationTime`, `lastUpdatetime`)
VALUES
  ('BK000023', '企业应用架构模式', 8, '（英）Martin Fowler', '机械工业出版社',   '2014-07-03', 0, '系统管理员', '2014-07-03 09:12:00', NULL),
  ('BK000024', '精通Hibernate',   8, '刘洋',               '电子工业出版社',   '2014-05-03', 1, '系统管理员', '2014-05-03 10:25:00', NULL),
  ('BK000025', '天龙八部',        1, '金庸',               '中原出版社',       '2014-03-12', 0, '系统管理员', '2014-03-12 14:03:00', NULL),
  ('BK000026', '寻找家园',        4, '高尔泰',             '北京十月文艺出版社', '2014-03-01', 0, '系统管理员', '2014-03-01 16:40:00', NULL),
  ('BK000027', '小猫莫格成长系列', 5, '（英）朱迪斯·克尔',  '接力出版社',       '2014-01-01', 1, '系统管理员', '2014-01-01 08:30:00', NULL),
  ('BK000028', '平凡的世界',      2, '路遥',               '北京十月文艺出版社', '2019-01-20', 0, '系统管理员', '2019-01-20 11:15:00', NULL),
  ('BK000029', '苏东坡传',        3, '林语堂',             '湖南文艺出版社',   '2017-11-08', 0, '系统管理员', '2017-11-08 09:00:00', NULL),
  ('BK000030', '经济学原理',      6, '曼昆',               '北京大学出版社',   '2016-02-28', 0, '系统管理员', '2016-02-28 17:50:00', NULL);
