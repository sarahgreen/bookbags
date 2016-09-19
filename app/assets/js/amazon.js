/**
 * Amazon is a wrapper for all interactions with the Amazon Product Advertising API.
 */
var Amazon = Amazon || {};

(function () {
  var aws_host = 'ecs.amazonaws.com';
  var aws_uri = '/onca/xml';
  var aws_access_key_id = 'AKIAJIOHAZ7RBDBZRXTA';
  var aws_secret_key = '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';
  var aws_associate_tag = 'wwwlaurenzouc-20';

  /*
   * Given a Book object, query the Amazon API to generate
   * an array of IDs of similar books.
   */
  this.get_similar_books = function(book) {
    var deferred = $.Deferred();

    var similar_books_ids = [];

    var isbn;
    if (book.isbns.isbn13)
      isbn = book.isbns.isbn13;
    else if (book.isbns.isbn10)
      isbn = book.isbns.isbn10;
    else if (book.isbns.eisbn)
      isbn = book.isbns.eisbn;
    else
      deferred.reject("No ISBN found.");

    // request parameters
    var params = {
      IdType: 'ISBN',
      Operation: 'ItemLookup',
      ResponseGroup: 'Similarities',
      SearchIndex: 'Books',
      ItemId: isbn
    };

    // request the list of similar books
    aws_request(params).done(function(xml) {
      // parse out ASINs (Amazon Standard ID Numbers)
      var ASINs = get_ASINs_from_xml(xml);

      // create Book objects from the ASINs, return their IDs
      process_book(0, ASINs, [], function(book_ids) {
        deferred.resolve(book_ids);
      });
    });

    return deferred.promise();
  };

  /*
   * Given a list of ASINs, use each one to generate and
   * cache a Book object. Send an array of these objects'
   * IDs to the callback function.
   */
  var process_book = function(index, ASINs, books_processed_ids, callback) {
    // base case: all books processed
    if (index === ASINs.length) {
      callback(books_processed_ids);
      return;
    }

    // make recursive calls to generate a book from each ASIN
    create_book_from_ASIN(ASINs[index]).fail(function(e) {
      // retry in 2 seconds in case of "RequestThrottled" error
      window.setTimeout(function() {
        // if more than 3 recs found
        if (books_processed_ids.length >= 3) {
          // return early
          callback(books_processed_ids);
          return;
        }
        process_book(index, ASINs, books_processed_ids, callback);
      }, 2000);
    }).done(function(book_id) {
      books_processed_ids.push(book_id); // keep track of IDs
      process_book(index + 1, ASINs, books_processed_ids, callback);
    });
  };

  /*
   * Given a single Amazon Standard ID# (ASIN), use it to
   * create, cache, and return a Book object.
   */
  var create_book_from_ASIN = function(ASIN) {
    var deferred = $.Deferred();

    var book;
    var params = {
      ResponseGroup: 'ItemAttributes,Images',
      Operation: 'ItemLookup',
      ItemId: ASIN
    };
    // query Amazon API with ASIN to get more info
    aws_request(params).fail(function(e) {
      deferred.reject(e);
    }).done(function(xml) {
      book = generate_book_from_xml(xml); // create Book
      Cache.add_book(book); // cache
      deferred.resolve(book.id()); // return
    });

    return deferred.promise();
  };

  /*
   * Parse the Amazon API response XML, and use it to
   * construct and return a Book object.
   */
  var generate_book_from_xml = function(xml) {
    // parse XML
    var author = $(xml).find('Author').eq(0).text(),
    title = $(xml).find('Title').eq(0).text(),
    isbn = $(xml).find('ISBN').eq(0).text(),
    img = $(xml).find('LargeImage').eq(0).find('URL').text(),
    eisbn = $(xml).find('EISBN').eq(0).text(),
    url = $(xml).find('DetailPageURL').eq(0).text();
    
    // construct Book
    var new_book = new Book(title, author);
    new_book.isbns.isbn10 = isbn;
    new_book.isbns.eisbn = eisbn;
    new_book.image_url = img;
    new_book.amazon_product_url = url;
    return new_book;
  };

  /*
   * Parse API response XML to get a list of Amazon
   * Standard ID#s corresponding to the suggested books.
   */
  var get_ASINs_from_xml = function(xml) {
    var ASIN, ASINs_of_similar_books = [];
    $(xml).find('SimilarProduct').each(function() {
      ASIN = $(this).find('ASIN').text();
      if (ASINs_of_similar_books.indexOf(ASIN) == -1) // avoid duplicates
        ASINs_of_similar_books.push(ASIN);
    });
    return ASINs_of_similar_books;
  };

  /*
   * Send a request to the Amazon Product Advertising API using
   * the given parameters.
   */
  var aws_request = function(parameters) {
    var deferred = $.Deferred();

    // Get the current timestamp in UTC
    var timestamp = moment.utc().format('YYYY-MM-DD\\THH:mm:ss\\Z');

    // Set defaults
    var default_params = {
      Service: 'AWSECommerceService',
      AWSAccessKeyId: aws_access_key_id,
      AssociateTag: aws_associate_tag,
      Timestamp: timestamp,
      Version: '2009-03-31',
    };
    // Add caller-specified parameters
    $.extend(parameters, default_params);

    // Sort the parameters, encode the values, and create a string (canonicalized_query)
    var keys = [];
    for (var key in parameters) {
      keys.push(key);
    }
    keys.sort();
    var canonicalized_query = '';
    for (var i = 0; i < keys.length; i++) {
      canonicalized_query += (i > 0? '&' : '') + keys[i] + '=' + encodeURIComponent(parameters[keys[i]]);
    }

    // Create the string to sign and encode it into a signature
    var string_to_sign = 'GET\n' + aws_host + '\n' + aws_uri + '\n' + canonicalized_query;
    var signature = sign(aws_secret_key, string_to_sign);

    /**
     * Provided in the Amazon API JavaScript example.
     * https://aws.amazon.com/code/JavaScript/2609
     */
    function sign(secret, message) {
      var messageBytes = str2binb(message);
      var secretBytes = str2binb(secret);
      
      if (secretBytes.length > 16) {
          secretBytes = core_sha256(secretBytes, secret.length * chrsz);
      }
      
      var ipad = Array(16), opad = Array(16);
      for (var i = 0; i < 16; i++) { 
          ipad[i] = secretBytes[i] ^ 0x36363636;
          opad[i] = secretBytes[i] ^ 0x5C5C5C5C;
      }

      var imsg = ipad.concat(messageBytes);
      var ihash = core_sha256(imsg, 512 + message.length * chrsz);
      var omsg = opad.concat(ihash);
      var ohash = core_sha256(omsg, 512 + 256);
      
      var b64hash = binb2b64(ohash);
      var urlhash = encodeURIComponent(b64hash);
      
      return urlhash;
    }

    // Create the request to sign
    var url = 'http://' + aws_host + aws_uri + '?' + canonicalized_query + '&Signature=' + signature;
    $.get("http://query.yahooapis.com/v1/public/yql", {
        q: "select * from xml where url=\"" + url + "\"",
        format: "xml"
      }, function(xml) {
        if ($(xml).find('Error').eq(0).find('Code').text() == 'RequestThrottled') {
          deferred.reject('RequestThrottled');
        } else {
          deferred.resolve(xml);
        }
      }
    );

    return deferred.promise();
  };
}).call(Amazon);
