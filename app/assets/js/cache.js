/**
 * Cache keeps a cache of objects and requests/responses so that we don't need to make too many API requests.
 */
var Cache = Cache || {};

(function() {
  var users = [];

  /**
   * Map from bestseller list display name to BestsellerList object.
   */
  var bestseller_list_display_name_to_bestseller_list_map = {};

  /**
   * Map from book id to Book object.
   */
  var book_id_to_book_map = {};

  this.load = function() {
    var user_jsons = store.get('users');
    
    if (user_jsons === undefined) {
      // Clear the store since any relevant data is meaningless
      store.clear();
      return;
    }

    // Load users
    for (var i = 0; i < user_jsons.length; i++) {
      var user_json = user_jsons[i];
      var user = new User(user_json.name, user_json.image_url);

      // Book bags
      for (var j = 0; j < user_json.book_bags.length; j++) {
        var book_bag_json = user_json.book_bags[j];
        var book_bag = new BookBag(book_bag_json.name);
        book_bag.color = book_bag_json.color;
        book_bag.book_ids = book_bag_json.book_ids;
        user.book_bags.push(book_bag);
      }

      // Rejected books
      user.rejected_book_ids = user_json.rejected_book_ids;

      users[i] = user;
    }

    // Load books
    var book_jsons = store.get('books');
    for (var book_id in book_jsons) {
      var book_json = book_jsons[book_id];
      var book = new Book(book_json.title, book_json.author);
      book.image_url = book_json.image_url;
      book.isbns = book_json.isbns;
      book.bestseller_list_display_names = book_json.bestseller_list_display_names;
      book.description = book_json.description;
      book.amazon_product_url = book_json.amazon_product_url;
      Cache.add_book(book);
    }
  };

  this.save = function() {
    // JSON for storing books that users have in their book bags
    var book_jsons = {};

    // Save users
    var user_jsons = [];
    for (var i = 0; i < users.length; i++) {
      var user = users[i];
      var user_json = {
        name: user.name,
        image_url: user.image_url,
        book_bags: [],
        rejected_book_ids: user.rejected_book_ids
      };
      user_jsons[i] = user_json;

      // Add the books related to the book ids that the user has rejected to the book JSONs
      for (var rejected_book_id in user.rejected_book_ids) {
        add_book_to_book_jsons(rejected_book_id);
      }

      // Save book bags for this user
      for (var j = 0; j < user.book_bags.length; j++) {
        var book_bag = user.book_bags[j];
        var book_bag_json = {
          name: book_bag.name,
          color: book_bag.color,
          book_ids: book_bag.book_ids
        };
        user_json.book_bags.push(book_bag_json);

        // Add the books related to the book ids to the book JSONs
        for (var k = 0; k < book_bag.book_ids.length; k++) {
          var book_id = book_bag.book_ids[k];
          add_book_to_book_jsons(book_id);
        }
      }
    }

    function add_book_to_book_jsons(book_id) {
      var book = Cache.get_book_by_id(book_id);
      if (book) {
        book_jsons[book_id] = {
          title: book.title,
          author: book.author,
          image_url: book.image_url,
          isbns: book.isbns,
          bestseller_list_display_names: book.bestseller_list_display_names,
          description: book.description,
          amazon_product_url: book.amazon_product_url
        };
      }
    }

    store.set('users', user_jsons);
    store.set('books', book_jsons);
  };

  this.add_user = function(user) {
    users.push(user);
  };

  this.get_current_user = function() {
    return users[0];
  };

  this.get_all_users = function() {
    return users;
  };

  this.set_current_user = function(index) {
    var user = users[index];
    users.splice(index, 1);
    users.unshift(user);
  };

  /**
   * Adds a bestseller list given the display name and encoded name.
   */
  this.add_bestseller_list = function(display_name, encoded_name) {
    // Try to get the bestseller list from the map
    var bestseller_list = bestseller_list_display_name_to_bestseller_list_map[display_name];

    // Handle if the bestseller list does not exist in the map
    if (bestseller_list === undefined) {
      // Create a BestsellerList object and add it to the map
      bestseller_list = new BestsellerList(display_name);
      bestseller_list_display_name_to_bestseller_list_map[display_name] = bestseller_list;
    }

    // Add the encoded name to the bestseller list
    bestseller_list.add_encoded_name(encoded_name);
  };

  /**
   * Retrieves an array of all bestseller lists.
   */
  this.get_bestseller_lists = function() {
    var bestseller_lists_array = [];
    for (var display_name in bestseller_list_display_name_to_bestseller_list_map) {
      bestseller_lists_array.push(bestseller_list_display_name_to_bestseller_list_map[display_name]);
    }
    return bestseller_lists_array;
  };

  /**
   * Retrieves a BestsellerList object by its hash name.
   */
  this.get_bestseller_list_by_hash_name = function(hash_name) {
    for (var display_name in bestseller_list_display_name_to_bestseller_list_map) {
      var bestseller_list = bestseller_list_display_name_to_bestseller_list_map[display_name];
      if (bestseller_list.hash_name === hash_name) {
        return bestseller_list;
      }
    }
  };

  /**
   * Adds a book.
   */
  this.add_book = function(book) {
    // Get the book id
    var book_id = book.id();

    // Check if this book already exists. If so, then merge the two books
    if (book_id_to_book_map[book_id]) {
      var added_book = book_id_to_book_map[book_id];
      added_book.merge(book);
      book = added_book;
    }

    // Add the book to the books map
    book_id_to_book_map[book_id] = book;
  };

  /**
   * Retrieves a Book object by its id.
   */
  this.get_book_by_id = function(book_id) {
    return book_id_to_book_map[book_id];
  };
}).call(Cache);