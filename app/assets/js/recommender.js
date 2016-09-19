/*
 * Recommender is used to generate a list of recommended
 * books based on the specified user-bookbag combination.
 * Example usage:
 *  Recommender.get_recs(user, bookbag).done(function(recs) {
 *    // do something with recs (an array of Book IDs)
 *  });
 */
var Recommender = Recommender || {};

(function() {
  // master list of recommendations
  var all_recommendations = [];

  /*
   * Asynchronously return an array of recommended Book IDs
   * based on the given user and bookbag.
   */
  this.get_recs = function(user, bookbag) {
    all_recommendations = []; // reset list
    var deferred = $.Deferred();
    get_recs_for_book(0, bookbag, function() {
      // remove books rejected already by user
      purge_rejected_recs(user);
      deferred.resolve(all_recommendations);
    });
    return deferred.promise();
  };

  /*
   * Recursively generate a list of recommendations for each
   * book in the given bookbag, then pass it to callback.
   */
  var get_recs_for_book = function(index, bookbag, callback) {
    if (index === bookbag.book_ids.length) {
      callback();
      return;
    }

    // for the current book
    var book_id = bookbag.book_ids[index],
    book = Cache.get_book_by_id(book_id);
    ProgressBar.add(60/bookbag.book_ids.length);

    // query the API to get similar books
    Amazon.get_similar_books(book).fail(function(e) {
      console.error(e);
    }).done(function(recs) {
      $.extend(all_recommendations, recs);
      get_recs_for_book(index + 1, bookbag, callback);
    });
  };

  /*
   * Remove all books in the given user's Rejected list
   * from the list of recommendations.
   */
  var purge_rejected_recs = function(user) {
    for (var i = 0; i < all_recommendations.length; i++)
      if (user.rejected_book_ids[all_recommendations[i]])
        all_recommendations.splice(i,1);
  };
}).call(Recommender);
