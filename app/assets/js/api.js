 /**
 * API only deals with API calls to external sources such as the New York TImes API.
 */
var API = API || {};

(function () {
  // New York Times Books API
  var nyt_books_api_key = 'baa7c03c1f73f8209c642e482b8c6a57:19:70126464';
  var nyt_bestsellers_api_uri = 'http://api.nytimes.com/svc/books/v2/lists/';
  var nyt_book_reviews_api_uri = 'http://api.nytimes.com/svc/books/v3/reviews.jsonp';

  /**
   * Retrieves all bestseller lists. Adds the bestseller lists to the cache.
   */
  this.get_bestseller_lists = function() {
    var deferred = $.Deferred();

    // Make the AJAX call
    $.ajax({
      type: 'GET',
      dataType: 'jsonp',
      jsonp: 'callback',
      data: {
        'api-key': nyt_books_api_key
      },
      url: nyt_bestsellers_api_uri + 'names.jsonp',
      beforeSend: function() {
        ProgressBar.set(0);
      },
      error: function() {
        ProgressBar.set(100);
        deferred.reject('Could not get monthly bestseller lists.');
      },
      success: function(response) {
        // Get the bestseller lists
        var bestseller_lists = response.results;

        // Process all the lists
        process_list(0);
        function process_list(index) {
          if (index === bestseller_lists.length) {
            deferred.resolve();
            return;
          }

          // Get the list
          var list = bestseller_lists[index];

          // Get the display name and trim out words like "Hardcover", "Combined", "Paperback", etc.
          var display_name = list.display_name;
          if (display_name.indexOf('Combined Hardcover & Paperback ') === 0) {
            display_name = display_name.substr(31);
          }
          if (display_name.indexOf('Combined Print & E-Book ') === 0) {
            display_name = display_name.substr(24);
          }
          if (display_name.indexOf('Hardcover ') === 0) {
            display_name = display_name.substr(10);
          }
          if (display_name.indexOf('Paperback ') === 0) {
            display_name = display_name.substr(10);
          }
          if (display_name.indexOf('E-Book ') === 0) {
            display_name = display_name.substr(7);
          }
          if (display_name.indexOf('Trade ') === 0) {
            display_name = display_name.substr(6);
          }
          if (display_name.indexOf('Mass-Market ') === 0) {
            display_name = display_name.substr(12);
          }
          if (display_name.indexOf('Children\'s ') === 0) {
            display_name = 'Children\'s Books';
          }
          if (display_name === 'Advice & Misc.') {
            display_name = 'Advice, How-To & Miscellaneous';
          }
          if (display_name === 'Advice, How-To & Miscellaneous') {
            display_name = 'Advice, How-To & Misc.';
          }

          // Add this bestseller list to the cache
          Cache.add_bestseller_list(display_name, list.list_name_encoded);

          // Move to the next list
          process_list(index + 1);
        }
      }
    });

    return deferred.promise();
  };

  /**
   * Gets a list of books for a given bestseller list.
   */
  this.get_books_for_bestseller_list = function(bestseller_list) {
    var deferred = $.Deferred();

    // Create a date string for today's date
    var today = new Date();
    var year = today.getFullYear();
    var month = ((today.getMonth() + 1) < 10 ? '0' : '') + (today.getMonth() + 1);
    var day = (today.getDate() < 10 ? '0' : '') + today.getDate();
    var date_str = year + '-' + month + '-' + day;

    // Create an AJAX call object for each encoded name
    var encoded_names = bestseller_list.get_encoded_names();
    var ajax_calls = [];
    create_ajax_call(0);
    ProgressBar.start_loading();
    function create_ajax_call(index) {
      if (index === encoded_names.length) {
        $.ajax(ajax_calls[0]);
        return;
      }

      var encoded_name = encoded_names[index];
      ajax_calls[index] = {
        type: 'GET',
        dataType: 'jsonp',
        jsonp: 'callback',
        data: {
          'api-key': nyt_books_api_key
        },
        url: nyt_bestsellers_api_uri + date_str + '/' + encoded_name + '.jsonp'
      };

      if (index === encoded_names.length - 1) {
        ajax_calls[index].error = function() {
          console.log('Could not get books for ' + encoded_name + '.');
          deferred.resolve();
        };
        ajax_calls[index].success = function(response) {
          process_response(response);
          deferred.resolve();
        };
      } else {
        ajax_calls[index].error = function() {
          console.log('Could not get books for ' + encoded_name + '.');
          $.ajax(ajax_calls[index+1]);
        };
        ajax_calls[index].success = function(response) {
          process_response(response);
          $.ajax(ajax_calls[index+1]);
        };
      }

      create_ajax_call(index + 1);
    }

    function process_response(response) {
      // Get the bestseller books
      var bestseller_books = response.results;

      // Process all the books
      process_book(0);
      function process_book(index) {
        if (index === bestseller_books.length) {
          return;
        }

        // Get the book
        var bestseller_book = bestseller_books[index];

        // Create a Book object and add to the cache
        var book = new Book(bestseller_book.book_details[0].title, bestseller_book.book_details[0].author);
        book.image_url = bestseller_book.book_details[0].book_image;
        book.isbns.isbn10 = bestseller_book.book_details[0].primary_isbn10;
        book.isbns.isbn13 = bestseller_book.book_details[0].primary_isbn13;
        book.bestseller_list_display_names[bestseller_list.display_name] = true;
        book.description = bestseller_book.book_details[0].description;
        book.amazon_product_url = bestseller_book.book_details[0].amazon_product_url;
        Cache.add_book(book);

        // Add the book id to the bestseller list
        bestseller_list.add_book(book.id());

        // Move to the next book
        process_book(index + 1);
      }
    }

    return deferred.promise();
  };

  this.get_nyt_review_for_book = function(book) {
    var deferred = $.Deferred();

    // Make the AJAX call
    $.ajax({
      type: 'GET',
      dataType: 'jsonp',
      jsonp: 'callback',
      data: {
        'api-key': nyt_books_api_key,
        'isbn': book.isbns.isbn13
      },
      url: nyt_book_reviews_api_uri,
      error: function() {
        deferred.reject('Could not get a review for this book.');
      },
      success: function(response) {
        var book_reviews = [];
        for (var i = 0; i < response.results.length; i++) {
          var json = response.results[i];
          book_reviews[i] = new BookReview(json.byline, json.summary, json.url);
        }
        deferred.resolve(book_reviews);
      }
    });

    return deferred.promise();
  };

}).call(API);
