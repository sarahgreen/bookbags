var BestsellerList = function(display_name) {
  /**
   * The actual name for this bestseller list.
   */
  this.display_name = display_name;

  /**
   * Name of hash to get to this page.
   */
  this.hash_name = 'bestseller-list-' + Pages.encode_str(display_name);

  /**
   * Set of encoded names associated with this bestseller list.
   * A bestseller list can have multiple book names because there are hardcover and paperback lists.
   * For example, a display name "Business Books" encompasses the encoded names "business-books", "hardcover-business-books", and "paperback-business-books"
   */
  this.encoded_names = {};

  /**
   * Set of book ids associated with the books in this list
   */
  this.book_ids = {};
};

BestsellerList.prototype.add_encoded_name = function(encoded_name) {
  this.encoded_names[encoded_name] = true;
};

BestsellerList.prototype.get_encoded_names = function() {
  var encoded_names_array = [];
  for (var encoded_name in this.encoded_names) {
    encoded_names_array.push(encoded_name);
  }
  return encoded_names_array;
};

BestsellerList.prototype.render = function(container) {
  var self = this;
  container.addClass('bestseller-list');

  container.on('click', function() {
    window.location.hash = self.hash_name;
  });

  $('<p>')
    .html(this.display_name)
    .appendTo(container);
};

BestsellerList.prototype.add_book = function(book_id) {
  this.book_ids[book_id] = true;
};

BestsellerList.prototype.get_books = function() {
  var books = [];
  for (var book_id in this.book_ids) {
    var book = Cache.get_book_by_id(book_id);
    books.push(book);
  }
  return books;
};