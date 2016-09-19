var BookReview = function(byline, summary, url) {
  this.byline = byline;
  this.summary = summary;
  this.url = url;
};

BookReview.prototype.render = function(container) {
  container.addClass('book-review');

  $('<p>')
    .addClass('byline')
    .text(this.byline)
    .appendTo(container);

  var summary = $('<div>')
    .addClass('summary')
    .append(this.summary + ' ')
    .appendTo(container);

  $('<a>')
    .attr('href', this.url)
    .attr('target', '_blank')
    .text('[Read more]')
    .appendTo(summary);
};