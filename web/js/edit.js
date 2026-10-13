/**
 * 修改图书信息页
 * - 回显图书数据
 * - 「入库人」和「入库时间」为只读状态，不可修改
 * - 必填项使用 jQuery 校验
 * - 修改成功或失败都会弹出提示，点击确定后回到图书列表页
 */
$(function () {
  'use strict';

  /** 必填项（「入库人」「入库时间」只读，但仍属于必填展示项） */
  const REQUIRED = [
    { selector: '#bookCode', label: '图书编号' },
    { selector: '#bookName', label: '图书名称' },
    { selector: '#bookType', label: '图书类型' },
    { selector: '#borrowed', label: '是否借阅' },
    { selector: '#createdBy', label: '入库人' },
    { selector: '#creationTime', label: '入库时间' },
  ];

  const bookId = App.getQuery('id');

  function goBack() {
    window.location.href = App.backUrl('index.html');
  }

  $('#btn-back').on('click', goBack);

  if (!bookId) {
    alert('缺少图书ID');
    goBack();
    return;
  }

  /** 加载图书类型下拉数据（数据来源：图书类型表 book_type） */
  function loadBookTypes(selectedId) {
    return App.api.get('/api/book-types').done(function (res) {
      const options = res.data.map(function (type) {
        const selected = String(type.id) === String(selectedId) ? ' selected' : '';
        return `<option value="${type.id}"${selected}>${App.escapeHtml(type.typeName)}</option>`;
      });
      $('#bookType').html(options.join(''));
    });
  }

  // 回显图书信息
  App.api.get(`/api/books/${bookId}`)
    .done(function (res) {
      const book = res.data;
      $('#bookCode').val(book.bookCode);
      $('#bookName').val(book.bookName);
      $('#bookAuthor').val(book.bookAuthor);
      $('#publishPress').val(book.publishPress);
      $('#borrowed').val(String(book.borrowed));
      $('#createdBy').val(book.createdBy);
      $('#creationTime').val(book.creationTimeText);
      loadBookTypes(book.bookType);
    })
    .fail(function (jqXHR) {
      alert(`查询图书信息失败！\n${App.errorMessage(jqXHR)}`);
      goBack();
    });

  /** jQuery 校验必填项，返回缺失的字段名数组 */
  function validate() {
    const missing = [];
    $('input, select').removeClass('invalid');

    REQUIRED.forEach(function (item) {
      const $el = $(item.selector);
      if ($.trim($el.val()) === '') {
        $el.addClass('invalid');
        missing.push(item.label);
      }
    });

    return missing;
  }

  // 只读字段不参与输入校验的清除
  $('#bookCode, #bookName, #bookType, #bookAuthor, #publishPress, #borrowed').on('input change', function () {
    $(this).removeClass('invalid');
  });

  $('#book-form').on('submit', function (e) {
    e.preventDefault();

    const missing = validate();
    if (missing.length > 0) {
      alert(`请填写必填项：${missing.join('、')}`);
      return;
    }

    // 注意：不提交入库人与入库时间，服务端同样会忽略这两个字段
    const payload = {
      bookCode: $.trim($('#bookCode').val()),
      bookName: $.trim($('#bookName').val()),
      bookType: $('#bookType').val(),
      bookAuthor: $.trim($('#bookAuthor').val()),
      publishPress: $.trim($('#publishPress').val()),
      borrowed: $('#borrowed').val(),
    };

    App.api.put(`/api/books/${bookId}`, payload)
      .done(function () {
        alert('修改成功！');
        goBack();
      })
      .fail(function (jqXHR) {
        alert(`修改失败！\n${App.errorMessage(jqXHR)}`);
      });
  });
});
