/**
 * Pages handles how to render each type of page.
 */
var Pages = Pages || {};

(function() {
  var main_container = $('main .inner');
  var help = [
  {
    "question" : "What is Book Bags?",
    "answer" : "Book Bags is a web application for you to create lists of books (\"Book Bags\"), which we analyze in order to recommend similar books you might enjoy. We start you off with New York Times Bestsellers, and highlight Bestsellers among our recommendations."
  },
  {
    "question" : "How do I create a Book Bag?",
    "answer": "Navigate to your dashboard, and click the gray icon of a bag with a plus sign. Then type in the name of your new Book Bag."
  },
  {
    "question" : "How do I delete a Book Bag?",
    "answer": "Select a Book Bag from your dashboard, and click the red \"Delete Book Bag\" button at the bottom. You will be prompted to click the button again to confirm the delete."
  },
  {
    "question" : "How do I add books to a Book Bag?",
    "answer": "To get started, explore the New York Times Bestsellers listed by category on your dashboard. Click a category to look at those books. Then click a red \"Add to Book Bag\" button to add that book to one or more Book Bags."
  },
  {
    "question" : "Where are my recommendations?",
    "answer": "Before you can get recommendations, be sure to add some books to a Book Bag. Then click into that Book Bag from the dashboard to view recommendations based on that Book Bag. You can also see recommendations on the dashboard, by choosing a Book Bag in the drop down list next to \"Show recommendations based on:\"."
  },
  {
    "question" : "What does \"Not Interested\" mean?",
    "answer": "If you mark a book \"Not Interested,\" it will fade into the background, so you can focus instead on books you might be interested in. If you change your mind about a \"Not Interested\" book, just click the \"Interested\" button."
  },
  {
    "question" : "How are my recommendations generated?",
    "answer": "Our algorithm takes into account the books you have added to a Book Bag, and finds other related books. They might be by the same author, from the same genre, etc."
  },
  {
    "question" : "What are profiles?",
    "answer": "If you are sharing your Book Bags account with someone else, you can each create your own profile. That way, your Book Bags and recommendations are neatly separated between your profiles."
  }
  ];

  this.clear_page = function() {
    var deferred = $.Deferred();
    var page_type = $('main').attr('data-page');

    switch(page_type) {
      case 'dashboard':
        Pages.clear_dashboard_page().done(function() {
          deferred.resolve();
        });
        break;
      case 'book-bag':
        Pages.clear_book_bag_page().done(function() {
          deferred.resolve();
        });
        break;
      case 'bestseller-list':
        Pages.clear_bestseller_list_page().done(function() {
          deferred.resolve();
        });
        break;
      case 'account-creation':
        Pages.clear_account_creation_page().done(function() {
          deferred.resolve();
        });
        break;
      default:
        main_container.empty().promise().done(function() {
          deferred.resolve();
        });
    }

    return deferred.promise();
  };

  this.render_dashboard_page = function(user) {
    $('main').attr('data-page', 'dashboard');

    // Remove all the <a>s besides dashboard <a>
    $('nav [data-nav!=dashboard]').remove();

    // Check if this user has any book bags
    $('<h2>')
      .text(user.name + '\'s Book Bags')
      .appendTo(main_container);
    var book_bags_section = $('<section>')
      .attr('id', 'book-bags-section')
      .appendTo(main_container);

    // Show the user's book bags
    show_book_bag(0);
    function show_book_bag(index) {
      if (index === user.book_bags.length) {
        return;
      }

      var book_bag = user.book_bags[index];
      var book_bag_container = $('<div>')
        .appendTo(book_bags_section)
        .on('click', function() {
          window.location.hash = book_bag.hash_name;
        });
      book_bag.render(book_bag_container);

      show_book_bag(index + 1);
    }

    // Add book bag button
    var add_book_bag_button_book_bag = new BookBag('');
    add_book_bag_button_book_bag.color = add_book_bag_button_book_bag.gray_color;
    var add_book_bag_button = $('<div>')
      .addClass('add-book-bag-button')
      .appendTo(book_bags_section)
      .on('click', function() {
        // Add a book bag
        var new_book_bag = new BookBag('');
        var new_book_bag_container = $('<div>')
          .insertBefore(add_book_bag_button);
        new_book_bag.render(new_book_bag_container, true);
        new_book_bag_container.css('cursor', 'auto');
        var new_book_bag_form = $('<form>')
          .addClass('book-bag-name-form')
          .appendTo(new_book_bag_container);
        var new_book_bag_saved = $('<div>')
          .addClass('saved')
          .text('Saved!');
        var new_book_bag_textarea = $('<div>')
          .addClass('book-name')
          .attr('contentEditable', 'true')
          .text('Book Bag Title...')
          .appendTo(new_book_bag_form)
          .focus()
          .on('keypress', function(e) {
            if (e.keyCode === 13) {
              e.preventDefault();
              $(this).blur();
            }
          })
          .on('blur', function() {
            new_book_bag_textarea.attr('contentEditable', 'false');
            new_book_bag.name = new_book_bag_textarea.text();
            new_book_bag.hash_name = 'book-bag-' + Pages.encode_str(new_book_bag.name);

            // Save the bag to the user
            user.book_bags.push(new_book_bag);
            Cache.save();

            new_book_bag_saved.show('blind', {
              drection: 'left'
            }, 200).promise().done(function() {
              setTimeout(function() {
                new_book_bag_saved.fadeOut().promise().done(function() {
                  new_book_bag_container.empty();
                  new_book_bag.render(new_book_bag_container);
                  new_book_bag_container
                    .on('click', function() {
                      window.location.hash = new_book_bag.hash_name;
                    })
                    .css('cursor', 'pointer');
                });
              }, 1000);
            });
          });
        select_text(new_book_bag_textarea);
        new_book_bag_saved.appendTo(new_book_bag_form).hide();
      });
    add_book_bag_button_book_bag.render(add_book_bag_button, true);
    $('<i>')
      .addClass('fa fa-plus')
      .appendTo(add_book_bag_button);

    $('<br />').appendTo(main_container);
    $('<br />').appendTo(main_container);

    // Show recommendations for one book bag
    var show_recommendations_header = $('<h2>')
      .text('Show recommendations based on ')
      .appendTo(main_container);
    var show_recommendations_dropdown = $('<ul>')
      .attr('id', 'show-recommendations-dropdown')
      .appendTo(show_recommendations_header);
    var selected_book_bag = $('<li>')
      .appendTo(show_recommendations_dropdown);
    $('<br />').appendTo(main_container);
    var recommended_books_container = $('<section>')
      .addClass('books')
      .appendTo(main_container);

    add_book_bag_to_dropdown(0);
    function add_book_bag_to_dropdown(index) {
      if (index === user.book_bags.length) {
        return;
      }

      var book_bag = user.book_bags[index];
      var li = $('<li>')
        .text(book_bag.name)
        .on('click', function() {
          ProgressBar.set(0);
          $('.selected').removeClass('selected');
          $(this).addClass('selected');
          selected_book_bag.text(book_bag.name);

          recommended_books_container.children().each(function() {
            $(this).hide('drop', {
              direction: 'down'
            }, 200).promise().done(function() {
              $(this).remove();
            });
          }).promise().done(function() {
            ProgressBar.add_random(5, 10);

            Recommender.get_recs(Cache.get_current_user(), book_bag).done(function(response) {
              ProgressBar.add_random(20, 30);
              console.log(response);

              if (response.length === 0) {
                $('<p>').text('No recommendations found. Add some books to this Book Bag!').appendTo(recommended_books_container);
              } else {
                var books = [];
                for (var i = 0; i < response.length; i++) {
                  var book = Cache.get_book_by_id(response[i]);
                  if (book.title.length > 0) {
                    books.push(book);
                  }
                }
                render_books(books, recommended_books_container);
              }

              ProgressBar.set(100);
            });
          });
        })
        .css('top', 59*(index + 1) + 'px')
        .appendTo(show_recommendations_dropdown);
      if (index === 0) {
        li.trigger('click');
      }

      add_book_bag_to_dropdown(index + 1);
    }

    $('<br />').appendTo(main_container);
    $('<br />').appendTo(main_container);

    // Show bestseller lists
    $('<h2>')
      .text('New York Times Bestsellers')
      .appendTo(main_container);
    var bestseller_lists_section = $('<section>')
      .attr('id', 'bestseller-lists-section')
      .appendTo(main_container);
    if (Cache.get_bestseller_lists().length === 0) {
      API.get_bestseller_lists().done(function() {
        render_bestseller_lists();
      });
    } else {
      render_bestseller_lists();
    }

    function render_bestseller_lists() {
      var bestseller_lists = Cache.get_bestseller_lists();
      for (var i = 0; i < bestseller_lists.length; i++) {
        var bestseller_list = bestseller_lists[i];
        var bestseller_list_container = $('<div>').appendTo(bestseller_lists_section);
        bestseller_list.render(bestseller_list_container);
      }
    }
  };

  this.clear_dashboard_page = function() {
    var deferred = $.Deferred();

    main_container.children().hide('drop', {
      direction: 'down'
    }, 400).promise().done(function() {
      $(this).remove().promise().done(function() {
        deferred.resolve();
      });
    });

    return deferred.promise();
  };

  this.render_book_bag_page = function(book_bag) {
    ProgressBar.set(0);
    $('main').attr('data-page', 'book-bag');

    // Remove all nav <a>s after Dashboard<a>
    $('nav [data-nav!=dashboard]').remove();
    var nav = $('<a>')
      .attr('href', '#' + book_bag.hash_name)
      .attr('data-nav', 'book-bag')
      .text(book_bag.name)
      .appendTo('nav');

    // Color picker
    var color_picker = $('<div>')
      .attr('id', 'color-picker')
      .appendTo(main_container);
    var color_picker_text = $('<p>')
      .text('Book Bag color: ')
      .attr('style', 'padding-right: 5px; display: inline;')
      .appendTo(color_picker);
    var colors = book_bag.colors;
    add_color_to_color_picker(0);
    function add_color_to_color_picker(index) {
      if (index === colors.length) {
        return;
      }

      var color_block = $('<div>')
        .css('background', colors[index].base)
        .on('click', function() {
          book_bag.color = colors[index];
          Cache.save();
          $('.selected').removeClass('selected');
          $(this).addClass('selected');
        })
        .hover(function() {
          $(this).css('background', colors[index].dark);
        }, function() {
          $(this).css('background', colors[index].base);
        })
        .appendTo(color_picker);
      if (book_bag.color.base === colors[index].base) {
        color_block.addClass('selected');
      }

      add_color_to_color_picker(index + 1);
    }

    // Edit book bag name
    var book_bag_name_edit = $('<h1>')
      .attr('contentEditable', true)
      .attr('style', 'cursor: auto')
      .text(book_bag.name)
      .appendTo(main_container);
    book_bag_name_edit.on('focus', function() {
      select_text(book_bag_name_edit);
    }).on('blur', function() {
      var new_name = $(this).text();
      book_bag.name = new_name;
      Cache.save();
      nav.text(book_bag.name);
    });

    // Recommendations
    $('<h2>')
      .text('Recommended Books')
      .appendTo(main_container);
    var recommended_books_container = $('<section>')
      .addClass('books')
      .appendTo(main_container);
    Recommender.get_recs(Cache.get_current_user(), book_bag).done(function(response) {
      ProgressBar.add_random(20, 30);

      if (response.length === 0) {
        $('<p>').text('No recommendations found. Try adding some books to this Book Bag!').appendTo(recommended_books_container);
        $('<p>').text('').appendTo(recommended_books_container);
      } else {
        var books = [];
        for (var i = 0; i < response.length; i++) {
          var book = Cache.get_book_by_id(response[i]);
          if (book.title.length > 0) {
            books.push(book);
          }
        }
        render_books(books, recommended_books_container);
      }

      ProgressBar.set(100);
    });

    // Books in
    $('<h2>')
      .text('Books in Book Bag')
      .appendTo(main_container);
    var books_container = $('<section>')
      .addClass('books')
      .appendTo(main_container);
    if (book_bag.book_ids.length > 0) {
      var books = [];
      for (i = 0; i < book_bag.book_ids.length; i++) {
        books[i] = Cache.get_book_by_id(book_bag.book_ids[i]);
      }
      render_books(books, books_container);
    } else {
      $('<p>')
        .text('There don\'t seem to be any books here. Add some NYT Bestsellers.')
        .appendTo(books_container);
    }

    // Remove book bag button
    var remove_button = $('<button>')
      .attr('id', 'remove-book-bag-button')
      .text('Delete Book Bag')
      .on('click', function() {
        if ($(this).text() === 'Delete Book Bag') {
          remove_timer(10);
        } else {
          window.clearTimeout();
          Cache.get_current_user().remove_book_bag(book_bag);
          Cache.save();
          window.location.hash = '#';
        }
      })
      .appendTo(main_container);
    function remove_timer(seconds_left) {
      if (seconds_left === 0) {
        remove_button.text('Delete Book Bag');
        return;
      }

      remove_button.text('Are you sure? Please click on this button within the next ' + seconds_left + ' seconds.');
      window.setTimeout(function() {
        remove_timer(seconds_left - 1);
      }, 1000);
    }
  };

  this.clear_book_bag_page = function() {
    var deferred = $.Deferred();

    main_container.children().hide('drop', {
      direction: 'down'
    }, 400).promise().done(function() {
      $(this).remove().promise().done(function() {
        deferred.resolve();
      });
    });

    return deferred.promise();
  };


  this.render_bestseller_list_page = function(bestseller_list) {
    $('main').attr('data-page', 'bestseller-list');

    // Remove all nav <a>s after Dashboard <a>
    $('nav [data-nav!=dashboard]').remove();
    $('<a>')
      .attr('href', '#' + bestseller_list.hash_name)
      .attr('data-nav', 'bestseller-list')
      .text(bestseller_list.display_name)
      .appendTo('nav');

    $('<h2>')
      .html('Bestseller List: ' + bestseller_list.display_name)
      .appendTo(main_container);

    // Get the books for this bestseller list
    var books = bestseller_list.get_books();
    var books_container = $('<section>')
      .addClass('books')
      .appendTo(main_container);
    if (books.length === 0) {
      API.get_books_for_bestseller_list(bestseller_list).done(function() {
        books = bestseller_list.get_books();
        render_books(books, books_container);
        ProgressBar.set(100);
      });
    } else {
      render_books(books, books_container);
      ProgressBar.set(100);
    }
  };

  this.clear_bestseller_list_page = function() {
    var deferred = $.Deferred();

    main_container.children().hide('drop', {
      direction: 'down'
    }, 400).promise().done(function() {
      $(this).remove().promise().done(function() {
        deferred.resolve();
      });
    });

    return deferred.promise();
  };

  this.render_error_page = function() {

  };

  /**
   * Prompts the user to create an account
   */
  this.render_account_creation_page = function() {
    var deferred = $.Deferred();
    Pages.clear_page();
    $('main').attr('data-page', 'account-creation');

    // Sections
    var user_name_section = $('<section>')
      .attr('id', 'user-name-section')
      .appendTo(main_container);
    var user_avatar_section = $('<section>')
      .attr('id', 'user-avatar-section')
      .appendTo(main_container)
      .hide();
    var avatar_label = $('<label>');

    // User name section
    $('<label>')
      .text('Hello There! What\'s your name?')
      .appendTo(user_name_section);
    var user_name_submit = $('<button>')
      .attr('type', 'submit')
      .text('next')
      .on('click', function() {
        user_name_section.hide('drop', {
          direction: 'up'
        }, 400).promise().done(function() {
          user_avatar_section.show('drop', {
            direction: 'down'
          }, 400);
        });
      });
    var user_name_input = $('<input>')
      .attr('type', 'text')
      .on('keydown', function(e) {
        if (e.keyCode === 13) {
          if (user_name_submit.hasClass('show')) {
            user_name_submit.trigger('click');
          }
        }

        var name = $(this).val();
        if (name.length > 0) {
          avatar_label.text('Nice to meet you, ' + name + '. Please pick an avatar.');
          if (!user_name_submit.hasClass('show')) {
            user_name_submit.addClass('show');
          }
        } else {
          if (user_name_submit.hasClass('show')) {
            user_name_submit.removeClass('show');
          }
        }
      })
      .appendTo(user_name_section)
      .focus();
    user_name_submit
      .appendTo(user_name_section);

    // User avatar section
    avatar_label
      .appendTo(user_avatar_section);
    add_avatar(1, 4);
    var user_avatar_submit = $('<button>')
      .attr('type', 'submit')
      .text('done')
      .on('click', function() {
        var user_name = user_name_input.val();
        var user_image_url = $('.avatar.selected').attr('data-image-url');
        var new_user = new User(user_name, user_image_url);
        new_user.book_bags.push(new BookBag('Books I Like'));
        Cache.add_user(new_user);
        Cache.save();
        deferred.resolve();
      })
      .appendTo(user_avatar_section);

    function add_avatar(avatar_number, number_of_avatars) {
      if (avatar_number > number_of_avatars) {
        return;
      }

      var image_url = 'assets/images/avatar-' + avatar_number + '.png';
      $('<div>')
        .addClass('avatar')
        .css('background-image', 'url(' + image_url + ')')
        .attr('data-image-url', image_url)
        .on('click', function() {
          $('.avatar.selected').removeClass('selected');
          $(this).addClass('selected');
          if (!user_avatar_submit.hasClass('show')) {
            user_avatar_submit.addClass('show');
          }
        })
        .appendTo(user_avatar_section);

      add_avatar(avatar_number + 1, number_of_avatars);
    }

    return deferred.promise();
  };

  this.clear_account_creation_page = function() {
    var deferred = $.Deferred();

    $('#user-avatar-section').hide('drop', {
      direction: 'down'
    }, 400).promise().done(function() {
      main_container.empty().promise().done(function() {
        deferred.resolve();
      });
    });

    return deferred.promise();
  };

  this.render_help_page = function() {
    $('main').attr('data-page', 'help');

    // Add <a>
    $('<a>')
      .attr('href', '#help')
      .attr('data-nav', 'help')
      .text('Help')
      .appendTo('nav');

    $('<h2>')
      .text('Help & Support')
      .appendTo(main_container);

    load_help(0);
    function load_help(index) {
      if (index === help.length) {
        return;
      }

      var help_bit = help[index];

      var arrow = $('<i>')
        .addClass('fa fa-chevron-circle-right');
      $('<h3>')
        .addClass('question')
        .text(help_bit.question)
        .prepend(arrow)
        .on('click', function() {
          if ($(this).hasClass('expanded')) {
            $(this).removeClass('expanded');
            arrow.attr('class', 'fa fa-chevron-circle-right');
          } else {
            $(this).addClass('expanded');
            arrow.attr('class', 'fa fa-chevron-circle-down');
          }
        })
        .appendTo(main_container);
      $('<p>')
        .addClass('answer')
        .html(help_bit.answer)
        .appendTo(main_container);
      load_help(index + 1);
    }

  };

  /*
   * Display introductory text block.
   */
  this.render_intro_div = function() {
    var intro_div = $('<div>')
      .attr('id', 'intro')
      .appendTo($('body'));

    $('main').addClass('blur');

    var intro_text = $('<div>')
      .addClass('intro-text')
      .html('<h2>Welcome to Book Bags!</h2><br /><p>To get started, check out the New York Times Bestseller lists.</p><p>Add some bestsellers to your own custom Book Bags.</p><p>We\'ll use your Book Bags to recommend new books for you.</p>')
      .appendTo(intro_div);

    var next_btn = $('<button>')
      .attr('type', 'submit')
      .text('Okay, got it!')
      .appendTo(intro_div)
      .on('click', function() {
        intro_div.fadeOut().promise().done(function() {
          $(this).remove();
        });
        $('main').removeClass('blur');
      });
  };

  /**
   * Converts a string into a string suitable for a hash (#).
   * Replaces spaces with hyphens, removes quotations and weird characters, etc.
   */
  this.encode_str = function(str) {
    str = str.toLowerCase();
    str = str.replace(/ /g, '-');
    str = str.replace(/&/g, 'and');
    str = str.replace(/'/g, '');
    str = str.replace(/,/g, '');
    return str;
  };

  function render_books(books, books_container) {
    var book_containers = [];

    render_book(0);
    function render_book(index) {
      if (index === books.length) {
        return;
      }

      var book = books[index];
      var book_container = $('<div>').appendTo(books_container);
      book.render(book_container);
      book_containers[index] = book_container;

      var user = Cache.get_current_user();
      if (book.id() in user.rejected_book_ids) {
        book_container.addClass('disabled');
        book_container.children('.info').first().children('.buttons-section').first().children('.not-interested-button').attr('data-interested', 'interested')
        .html('<i class="fa fa-thumbs-up"></i>Interested');

      }

      book_container.on('notinterested', function() {
        // Reject the book
        user.reject(book.id());

        // Remove the book from any book bags
        for (var i = 0; i < user.book_bags.length; i++) {
          var book_bag = user.book_bags[i];
          book_bag.remove(book);
        }

        Cache.save();
      }).on('reinterested', function() {
        user.unreject(book.id());
        Cache.save();
      });

      render_book(index + 1);
    }

    set_orders(book_containers);
    $(window).on('resize', function() {
      set_orders(book_containers);
    });

    function set_orders(book_containers) {
      var body_width = $(window).width();
      var divisions = 3;
      if (body_width <= 1800) {
        divisions = 2;
      }
      if (body_width <= 650) {
        divisions = 1;
      }

      for (var i = 0; i < book_containers.length; i++) {
        var book_container = book_containers[i];
        book_container.css('order', i);

        var section_order = (parseInt(i/divisions) + 1) * divisions;
        book_container.next().css('order', section_order);
      }
    }
  }
}).call(Pages);
