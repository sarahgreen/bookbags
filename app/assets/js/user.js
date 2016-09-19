var User = function(name, image_url) {
  this.name = name;
  this.image_url = image_url;
  this.book_bags = [];
  this.rejected_book_ids = {};
};

User.prototype.add_book_bag = function(book_bag) {
  this.book_bags.push(book_bag);
};

User.prototype.remove_book_bag = function(book_bag) {
  var index = $.inArray(book_bag, this.book_bags);
  this.book_bags.splice(index, 1);
};

/**
 * Mark a book as rejected / not interested.
 * These books will not show up as recommendations.
 */
User.prototype.reject = function(book_id) {
  this.rejected_book_ids[book_id] = true;
};

/*
 * Remove a book from the rejected list.
 */
User.prototype.unreject = function(book_id) {
  if (book_id in this.rejected_book_ids) {
    this.rejected_book_ids[book_id] = undefined;
  }
};

User.prototype.has_rejected = function(book) {
  return book.id() in Object.keys(this.rejected_books_by_id);
};
