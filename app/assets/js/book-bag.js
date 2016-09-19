var BookBag = function(name) {
  this.colors = [{
    base: '#3498DB',
    dark: '#2980B9',
    darker: '#1B5384'
  }, {
    base: '#9B59B6',
    dark: '#8E44AD',
    darker: '#6F169B'
  }, {
    base: '#E67E22',
    dark: '#D35400',
    darker: '#9F3007'
  }, {
    base: '#E74C3C',
    dark: '#C0392B',
    darker: '#961215'
  }];

  this.gray_color = {
    base: '#95A5A6',
    dark: '#7F8C8D'
  };

  this.name = name;
  this.hash_name = 'book-bag-' + Pages.encode_str(name);
  this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
  this.book_ids = [];
};

BookBag.prototype.render = function(container, no_hover) {
  var self = this;
  container.addClass('book-bag');
  
  // Add the handle
  var handle = $('<div>')
    .addClass('handle')
    .attr('data-content', this.color.base)
    .css('background', this.color.dark)
    .appendTo(container);
  var handle_left_corner = $('<div>')
    .addClass('handle-left-corner')
    .css({
      'border-bottom-color': this.color.base,
      'border-right-color': this.color.base,
    })
    .appendTo(handle);
  var handle_right_corner = $('<div>')
    .addClass('handle-right-corner')
    .css({
      'border-bottom-color': this.color.base,
      'border-left-color': this.color.base,
    })
    .appendTo(handle);
  var handle_left = $('<div>')
    .addClass('handle-left')
    .css('background', this.color.base)
    .appendTo(handle);
  var handle_right = $('<div>')
    .addClass('handle-right')
    .css('background', this.color.base)
    .appendTo(handle);

  // Add the base
  var base = $('<div>')
    .addClass('base')
    .css('background', this.color.base)
    .appendTo(container);

  // Add the name
  var max_length = 30;
  var trimmed_name = this.name.length > max_length? (this.name.substr(0, max_length) + '&hellip;') : this.name;
  $('<span>')
    .html(trimmed_name)
    .appendTo(base);

  // Hover
  if (!no_hover) {
    container.hover(function() {
      handle
        .attr('data-content', self.color.dark)
        .css('background', self.color.darker);
      handle_left_corner.css({
        'border-bottom-color': self.color.dark,
        'border-right-color': self.color.dark,
      });
      handle_right_corner.css({
        'border-bottom-color': self.color.dark,
        'border-left-color': self.color.dark,
      });
      handle_left.css('background', self.color.dark);
      handle_right.css('background', self.color.dark);
      base.css('background', self.color.dark);
    }, function() {
      handle
        .attr('data-content', self.color.base)
        .css('background', self.color.dark);
      handle_left_corner.css({
        'border-bottom-color': self.color.base,
        'border-right-color': self.color.base,
      });
      handle_right_corner.css({
        'border-bottom-color': self.color.base,
        'border-left-color': self.color.base,
      });
      handle_left.css('background', self.color.base);
      handle_right.css('background', self.color.base);
      base.css('background', self.color.base);
    });
  }
};

/*
 * Check whether the given book is in this bag.
 */
BookBag.prototype.contains = function(book) {
  return $.inArray(book.id(), this.book_ids) >= 0;
};

/*
 * If the given book is not in this bag, add it.
 */
BookBag.prototype.add = function(book) {
  if (!this.contains(book)) {
    Cache.add_book(book);

    this.book_ids.push(book.id());
    return true;
  }
  return false;
};

/*
 * If the given book is in this bag, remove it.
 */
BookBag.prototype.remove = function(book) {
  if (this.contains(book)) {
    this.book_ids.splice(this.book_ids.indexOf(book.id()), 1);
    return true;
  }
  return false;
};
