/**
 * 新增图书信息页
 * - 入库时间默认当前时间、入库人默认系统管理员、是否借阅默认未借阅
 * - 必填项使用 jQuery 校验
 * - 保存成功或失败都会弹出提示，点击确定后回到图书列表页
 */
$(function () {
  'use strict';

  /** 必填项：图书编号、图书名称、图书类型、是否借阅、入库人、入库时间 */
  const REQUIRED = [
    { selector: '#bookCode', label: '图书编号' },
    { selector: '#bookName', label: '图书名称' },
    { selector: '#bookType', label: '图书类型' },
    { selector: '#borrowed', label: '是否借阅' },
    { selector: '#createdBy', label: '入库人' },
    { selector: '#creationTime', label: '入库时间' },
  ];

  // 默认值
  $('#createdBy').val('系统管理员');
  $('#creationTime').val(App.today());
  $('#borrowed').val('0');

  // 图书类型下拉数据必须来源于图书类型表 book_type
  App.api.get('/api/book-types')
    .done(function (res) {
      const options = ['<option value="">——请选择——</option>'];
      res.data.forEach(function (type) {
        options.push(`<option value="${type.id}">${App.escapeHtml(type.typeName)}</option>`);
      });
      $('#bookType').html(options.join(''));
    })
    .fail(function () {
      alert('图书类型加载失败，请刷新页面重试');
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

  // 输入时清除错误样式
  $('input, select').on('input change', function () {
    $(this).removeClass('invalid');
  });

  $('#btn-back').on('click', function () {
    window.location.href = App.backUrl('index.html');
  });

  $('#book-form').on('submit', function (e) {
    e.preventDefault();

    const missing = validate();
    if (missing.length > 0) {
      alert(`请填写必填项：${missing.join('、')}`);
      $(REQUIRED.find((item) => missing.includes(item.label)).selector).focus();
      return;
    }

    const payload = {
      bookCode: $.trim($('#bookCode').val()),
      bookName: $.trim($('#bookName').val()),
      bookType: $('#bookType').val(),
      bookAuthor: $.trim($('#bookAuthor').val()),
      publishPress: $.trim($('#publishPress').val()),
      borrowed: $('#borrowed').val(),
      createdBy: $.trim($('#createdBy').val()),
      creationTime: $('#creationTime').val(),
    };

    App.api.post('/api/books', payload)
      .done(function () {
        alert('新增成功！');
        window.location.href = App.backUrl('index.html');
      })
      .fail(function (jqXHR) {
        alert(`新增失败！\n${App.errorMessage(jqXHR)}`);
      });
  });
});
