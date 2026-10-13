/**
 * 图书列表页
 * - 默认显示全部入库图书，按入库时间降序，每页 5 条
 * - 支持按图书名称模糊查询，查询条件写入地址栏，返回列表时自动恢复
 * - 提供查看 / 修改 / 删除 与 新增 入口
 */
$(function () {
  'use strict';

  const PAGE_SIZE = 5;
  const $list = $('#book-list');
  const $pagination = $('#pagination');
  const $input = $('#bookName');

  // 从地址栏读取查询条件（保证从详情/修改页返回时条件与结果都在）
  let keyword = App.getQuery('name');
  let currentPage = Number(App.getQuery('page')) || 1;
  let totalPages = 1;

  $input.val(keyword);

  /** 拼出当前列表页地址（含查询条件与页码） */
  function listUrl() {
    const params = new URLSearchParams();
    if (keyword) params.set('name', keyword);
    if (currentPage > 1) params.set('page', currentPage);
    const query = params.toString();
    return query ? `index.html?${query}` : 'index.html';
  }

  /** 把查询条件同步到地址栏，便于复制 / 刷新 / 返回时还原 */
  function syncUrl() {
    window.history.replaceState(null, '', listUrl());
  }

  /** 渲染表格数据 */
  function renderRows(list) {
    if (!list || list.length === 0) {
      $list.html('<tr class="empty-row"><td colspan="8">没有查询到图书信息</td></tr>');
      return;
    }

    const returnUrl = encodeURIComponent(listUrl());
    const rows = list.map(function (book) {
      return [
        '<tr>',
        `<td>${App.escapeHtml(book.bookCode)}</td>`,
        `<td>${App.escapeHtml(book.bookTypeName)}</td>`,
        `<td>${App.escapeHtml(book.bookName)}</td>`,
        `<td>${App.escapeHtml(book.bookAuthor)}</td>`,
        `<td>${App.escapeHtml(book.publishPress)}</td>`,
        `<td>${App.escapeHtml(book.creationTimeText)}</td>`,
        `<td>${App.escapeHtml(book.borrowedText)}</td>`,
        '<td class="ops">',
        `<a href="detail.html?id=${book.bookId}&returnUrl=${returnUrl}">查看</a>`,
        `<a href="edit.html?id=${book.bookId}&returnUrl=${returnUrl}">修改</a>`,
        `<a href="javascript:void(0)" class="link-danger" data-id="${book.bookId}">删除</a>`,
        '</td>',
        '</tr>',
      ].join('');
    });

    $list.html(rows.join(''));
  }

  /** 渲染分页控件：上一页 / 页码 / 下一页 / 共N页 / 跳转 */
  function renderPagination(page, pages) {
    totalPages = pages;
    const parts = [];
    const disabledPrev = page <= 1 ? ' disabled' : '';
    const disabledNext = page >= pages ? ' disabled' : '';

    parts.push(`<button type="button" class="page-btn" data-page="${page - 1}"${disabledPrev}>上一页</button>`);
    parts.push(`<button type="button" class="page-btn" data-page="${page - 1}"${disabledPrev}>&#9664;</button>`);

    // 页码窗口：最多显示 9 个，跟随当前页滑动
    let start = Math.max(1, page - 4);
    let end = Math.min(totalPages, start + 8);
    start = Math.max(1, end - 8);

    for (let i = start; i <= end; i += 1) {
      const active = i === page ? ' active' : '';
      parts.push(`<button type="button" class="page-btn${active}" data-page="${i}">${i}</button>`);
    }

    parts.push(`<button type="button" class="page-btn" data-page="${page + 1}"${disabledNext}>&#9654;</button>`);
    parts.push(`<button type="button" class="page-btn" data-page="${page + 1}"${disabledNext}>下一页</button>`);
    parts.push(`<span>共 ${totalPages} 页</span>`);
    parts.push('<span class="jump">到第 <input type="text" id="jump-page" value=""> 页 <button type="button" class="page-btn" id="jump-btn">确定</button></span>');

    $pagination.html(parts.join(''));
  }

  /** 加载指定页数据 */
  function load(page) {
    App.api.get('/api/books', { name: keyword, page: page, pageSize: PAGE_SIZE })
      .done(function (res) {
        const data = res.data;
        currentPage = data.page;
        syncUrl();
        renderRows(data.list);
        renderPagination(data.page, data.totalPages);
      })
      .fail(function (jqXHR) {
        alert(`查询失败！\n${App.errorMessage(jqXHR)}`);
      });
  }

  // 查询：条件写入地址栏，回到第 1 页
  $('#search-form').on('submit', function (e) {
    e.preventDefault();
    keyword = $.trim($input.val());
    load(1);
  });

  // 新增
  $('#btn-add').on('click', function () {
    window.location.href = `add.html?returnUrl=${encodeURIComponent(listUrl())}`;
  });

  // 分页按钮
  $pagination.on('click', '.page-btn', function () {
    const target = Number($(this).data('page'));
    if (!target || target === currentPage) return;
    load(target);
  });

  // 跳到指定页
  $pagination.on('click', '#jump-btn', function () {
    const target = Number($.trim($('#jump-page').val()));
    if (!target || target < 1 || target > totalPages) {
      alert(`请输入 1 ~ ${totalPages} 之间的页码`);
      return;
    }
    load(target);
  });

  $pagination.on('keydown', '#jump-page', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      $('#jump-btn').trigger('click');
    }
  });

  // 删除：先确认，再提交，最后提示结果
  $list.on('click', '.link-danger', function () {
    const bookId = $(this).data('id');
    if (!window.confirm('确认删除该条图书信息！')) {
      return;
    }

    App.api.remove(`/api/books/${bookId}`)
      .done(function () {
        alert('删除成功！');
        load(currentPage);
      })
      .fail(function (jqXHR) {
        alert(`删除失败！\n${App.errorMessage(jqXHR)}`);
      });
  });

  // 首次加载
  load(currentPage);
});
