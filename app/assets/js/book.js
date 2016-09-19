var Book = function(title, author) {
  // Initially set fields
  this.title = title;
  this.author = author;

  // Fields to set (required to set)
  this.image_url = undefined;
  this.isbns = {
    eisbn: undefined,
    isbn10: undefined,
    isbn13: undefined
  };
  this.description = undefined;
  this.amazon_product_url = undefined;

  // Fields related to bestseller
  this.bestseller_list_display_names = {};
};

/**
 * Returns the id for this book, which is the isbns combined together in one string.
 */
Book.prototype.id = function() {
  var id = '';

  if (this.isbns.eisbn !== undefined) {
    id += this.isbns.eisbn;
  }
  if (this.isbns.isbn10 !== undefined) {
    id += this.isbns.isbn10;
  }
  if (this.isbns.isbn13 !== undefined) {
    id += this.isbns.isbn13;
  }

  return id;
};

/**
 * Merges the information in this book with the information from another book.
 */
Book.prototype.merge = function(book) {
  // Merge the bestseller lists
  for (var bestseller_list_display_name in book.bestseller_list_display_names) {
    this.bestseller_list_display_names[bestseller_list_display_name] = true;
  }
};

Book.prototype.render = function(container) {
  var self = this;
  var user = Cache.get_current_user();
  container.addClass('book');

  // Add cover image
  var cover = $('<img>')
    .addClass('cover')
    .attr('src', 'assets/images/blank-book-cover.png')
    .appendTo(container);
  if (this.image_url) {
    cover.attr('src', this.image_url);
  }

  if (!$.isEmptyObject(self.bestseller_list_display_names)) {
    // Mark this book as a bestseller
    $('<div>')
      .addClass('bestseller-ribbon')
      .text('NYT')
      .appendTo(container);
    $('<div>')
      .addClass('bestseller-ribbon-shadow')
      .insertBefore(cover);
  }

  var wrapper = $('<div>')
    .addClass('info')
    .appendTo(container);

  // Add title
  var title = $('<p>')
    .addClass('title')
    .html(this.title)
    .appendTo(wrapper);
  $clamp(title[0], {clamp: 2});

  // Add author
  var author = $('<p>')
    .addClass('author')
    .html(this.author)
    .appendTo(wrapper);
  $clamp(author[0], {clamp: 2});

  // Add a spacer
  $('<div>')
    .addClass('spacer')
    .appendTo(wrapper);

  // Add buttons area
  var buttons_section = $('<section>')
    .addClass('buttons-section')
    .appendTo(wrapper);

  // Add "Add to book bag" section
  var add_to_book_bag_section = $('<section>')
    .appendTo(buttons_section);
  var add_to_book_bag_button = $('<button>')
    .addClass('add-to-book-bag-button')
    .append($('<i>').addClass('fa fa-heart'))
    .append('Add to Book Bag')
    .appendTo(add_to_book_bag_section);

  // Add to book bag chooser
  var add_to_book_bag_chooser = $('<ul>')
    .addClass('add-to-book-bag-chooser')
    .on('load', function() {
      // Hide other choosers
      $('.add-to-book-bag-chooser:visible').hide();

      // Load book bags into the chooser
      $('li').not('.add-new-book-bag-li').remove();
      add_to_book_bag_chooser_by_index(0);
    })
    .appendTo(add_to_book_bag_section)
    .hide();
  function add_to_book_bag_chooser_by_index(index) {
    if (index === user.book_bags.length) {
      // Adjust position
      var offset_top = ((user.book_bags.length + 1) * 30) / 2;
      add_to_book_bag_chooser.css('margin-top', '-' + offset_top + 'px');

      // Show
      add_to_book_bag_chooser.show('scale');
      return;
    }

    add_book_bag_to_chooser(user.book_bags[index]);

    add_to_book_bag_chooser_by_index(index + 1);
  }

  // Add an li for adding a book bag
  var add_new_book_bag_li = $('<li>')
    .addClass('add-new-book-bag-li')
    .appendTo(add_to_book_bag_chooser);
  var add_new_book_bag_button = $('<button>')
    .html('<i class="fa fa-check"></i>')
    .hide();
  var add_new_book_bag_input = $('<input>')
    .attr('type', 'text')
    .attr('placeholder', 'Add New Book Bag')
    .on('keyup', function(e) {
      if (e.keyCode === 13 && $(this).val().length > 0) {
        add_new_book_bag();
        return;
      }

      if ($(this).val().length > 0 && add_new_book_bag_button.is(':hidden')) {
        add_new_book_bag_button.show('blind', {
          direction: 'left'
        }, 200);
      }

      if ($(this).val().length === 0 && add_new_book_bag_button.is(':visible')) {
        add_new_book_bag_button.hide('blind', {
          direction: 'left'
        }, 200);
      }
    })
    .appendTo(add_new_book_bag_li);
  add_new_book_bag_button
    .on('click', function() {
      add_new_book_bag();
    })
    .appendTo(add_new_book_bag_li);
  function add_new_book_bag() {
    // Add a new book bag and add this book to it
    var new_book_bag = new BookBag(add_new_book_bag_input.val());
    user.book_bags.push(new_book_bag);
    new_book_bag.add(self);
    Cache.save();

    // Update the UI
    add_new_book_bag_input.val('').trigger('keyup');
    add_book_bag_to_chooser(new_book_bag);

    // Adjust position
    var offset_top = ((user.book_bags.length + 1) * 30) / 2;
    add_to_book_bag_chooser.css('margin-top', '-' + offset_top + 'px');
  }

  
  function add_book_bag_to_chooser(book_bag) {
    var book_bag_li = $('<li>')
      .on('click', function() {
        if ($(this).hasClass('active')) {
          // Remove book from book bag
          book_bag.remove(self);
          Cache.save();
          $(this).removeClass('active');
        } else {
          // Add book to book bag
          book_bag.add(self);
          Cache.save();
          $(this).addClass('active');
        }
      })
      .insertBefore(add_new_book_bag_li);
    $('<p>')
      .text(book_bag.name)
      .appendTo(book_bag_li);
    $('<i>')
      .addClass('fa fa-check')
      .appendTo(book_bag_li);

    if (book_bag.contains(self)) {
      book_bag_li.addClass('active');
    }
  }

  // Trigger add_to_book_bag_chooser show
  add_to_book_bag_button.on('click', function() {
    container.addClass('active');
    add_to_book_bag_chooser.trigger('load');
  });

  // Add "Not interested button"
  var not_interested_button = $('<button>')
    .addClass('not-interested-button')
    .attr('data-interested', 'not-interested')
    .append($('<i>').addClass('fa fa-thumbs-down'))
    .append('Not interested')
    .appendTo(buttons_section);

  // More info section
  var more_info_section = $('<section>')
    .addClass('more-info')
    .insertAfter(container);
  $('<p>')
    .addClass('title')
    .html(this.title)
    .appendTo(more_info_section);
  $('<p>')
    .addClass('author')
    .html(this.author)
    .appendTo(more_info_section);
  $('<div>')
    .addClass('description')
    .html(this.description)
    .appendTo(more_info_section);
  var book_reviews = $('<div>')
    .attr('data-loaded-reviews', 'false')
    .addClass('reviews')
    .appendTo(more_info_section);
  $('<button>')
    .addClass('amazon-button')
    .on('click', function() {
      var win = window.open(self.amazon_product_url, '_blank');
      win.focus();
    })
    .text('View on Amazon')
    .appendTo(more_info_section);

  // Add "More info" button
  var more_info_button = $('<button>')
    .addClass('more-info-button')
    .append($('<i>').addClass('fa fa-info-circle'))
    .append('More Info')
    .on('click', function() {
      toggle_more_info();
    })
    .appendTo(buttons_section);
  cover.on('click', function() {
    toggle_more_info();
  });

  // Active on hover
  container.hover(function() {
    if (!container.hasClass('active')) {
      container.addClass('active');
    }
  }, function() {
    if (container.hasClass('active') && !more_info_button.hasClass('active') && add_to_book_bag_chooser.is(':hidden')) {
      container.removeClass('active');
    }
  });

  // Not interested
  not_interested_button.on('click', function() {
    if ($(this).attr('data-interested') === 'not-interested') {
      container.addClass('disabled');
      $('.more-info.show').removeClass('show');
      $('.more-info-button.active').removeClass('active');
      $('.book.active').removeClass('active');
      container.trigger('notinterested');

      $(this)
        .attr('data-interested', 'interested')
        .html('<i class="fa fa-thumbs-up"></i>Interested');
    } else {
      container.removeClass('disabled');
      container.trigger('reinterested');

      $(this)
        .attr('data-interested', 'not-interested')
        .html('<i class="fa fa-thumbs-down"></i>Not Interested');
    }
  });


  // Toggle more info
  $('html').on('click', function() {
    // Hide more info
    if (more_info_button.hasClass('active') && $('.buttons-section:hover').length === 0 && $('.cover:hover').length === 0) {
      $('.more-info.show').removeClass('show');
      $('.more-info-button.active').removeClass('active');
      $('.book.active').removeClass('active');
    }

    // Hide chooser
    if ($('.add-to-book-bag-chooser').is(':visible') && $('.add-to-book-bag-chooser:hover').length === 0 && $('.add-to-book-bag-button:hover').length === 0) {
      $('.add-to-book-bag-chooser').hide('scale');
    }
  });
  function toggle_more_info() {
    if (more_info_button.hasClass('active')) {
      // Hide more info
      $('.more-info.show').removeClass('show');
      $('.more-info-button.active').removeClass('active');
      $('.book.active').removeClass('active');
    } else {
      // Get book reviews
      if (book_reviews.attr('data-loaded-reviews') === 'false') {
        API.get_nyt_review_for_book(self).done(function(reviews) {
          // Add in book reviews
          for (var i = 0; i < reviews.length; i++) {
            var book_review_container = $('<div>').appendTo(book_reviews);
            reviews[i].render(book_review_container);
          }

          book_reviews.attr('data-loaded-reviews', 'true');
        });
      }

      // Show more info
      $('.more-info.show').removeClass('show');
      more_info_section.addClass('show');

      $('.more-info-button.active').removeClass('active');
      more_info_button.addClass('active');

      $('.book.active').removeClass('active');
      container.addClass('active');
    }
  }
};
