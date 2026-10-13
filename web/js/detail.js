/**
 * 查看图书信息页
 * 所有字段只读；点击「返回」回到列表页，并保留原来的查询条件与页码。
 */
$(function () {
  'use strict';

  const bookId = App.getQuery('id');

  function goBack() {
    window.location.href = App.backUrl('index.html');
  }

  // 返回列表页（保留查询条件与查询结果）
  $('#btn-back').on('click', goBack);

  if (!bookId) {
    alert('缺少图书ID');
    goBack();
    return;
  }

  App.api.get(`/api/books/${bookId}`)
    .done(function (res) {
      const book = res.data;
      $('#bookCode').val(book.bookCode);
      $('#bookName').val(book.bookName);
      $('#bookType').val(book.bookTypeName);
      $('#bookAuthor').val(book.bookAuthor);
      $('#publishPress').val(book.publishPress);
      $('#borrowed').val(String(book.borrowed));
      $('#createdBy').val(book.createdBy);
      $('#creationTime').val(book.creationTimeText);
    })
    .fail(function (jqXHR) {
      alert(`查询图书信息失败！\n${App.errorMessage(jqXHR)}`);
      goBack();
    });
});
