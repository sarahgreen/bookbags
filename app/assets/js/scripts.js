$(document).ready(function() {
  if (!store.enabled) {
    console.log('Local storage is not supported by your browser. Please disable "Private Mode", or upgrade to a modern browser.');
    return;
  }

  Cache.load();

  // Handle changing and adding users
  $('#change-user').hide();
  $('#current-user')
    .on('click', function() {
      if ($('#change-user').is(':hidden')) {
        $('#change-user').show('blind', {
          direction: 'up'
        }, 200);
        $(this)
          .addClass('change-user')
          .css('width', $('#change-user').width());
      } else {
        $('#change-user').hide('blind', {
          direction: 'up'
        }, 200);
        $('#current-user')
          .removeClass('change-user')
          .css('width', 'auto');
      }
    });
  $('body').on('click', function() {
      if ($('#change-user').is(':visible') && $('#change-user:hover').length === 0 && $('#current-user:hover').length === 0) {
        $('#change-user').hide('blind', {
          direction: 'up'
        }, 200);
        $('#current-user')
          .removeClass('change-user')
          .css('width', 'auto');
      }
    });
  $('#add-user').on('click', function() {
    Pages.render_account_creation_page().done(function() {
      Cache.set_current_user(Cache.get_all_users().length - 1);
      load();
      Pages.render_intro_div();
    });
  });

  load();
  $(window).on('hashchange', function() {
    load();
  });
});

function load() {
  var hash = window.location.hash.substr(1);

  // Check if there is a user stored  
  if (Cache.get_current_user()) {
    load_page();
  } else {
    Pages.render_account_creation_page().done(function() {
      load_page();
      Pages.render_intro_div();
    });
    return;
  }

  function load_page() {
    // Add the user name and image
    var user = Cache.get_current_user();
    $('#user-name').text(user.name);
    $('#user-avatar').css('background-image', 'url(' + user.image_url + ')');
    $('#change-user').css('min-width', $('#current-user').outerWidth());

    // Load all the users
    var users = Cache.get_all_users();
    $('#change-user li').not('#add-user').remove();
    add_user(1);
    function add_user(index) {
      if (index === users.length) {
        return;
      }

      var user_li = $('<li>')
        .on('click', function() {
          Cache.set_current_user(index);
          Cache.save();
          load();
        })
        .insertBefore('#add-user');
      $('<p>')
        .addClass('user-name')
        .text(users[index].name)
        .appendTo(user_li);
      $('<div>')
        .addClass('user-avatar')
        .css('background-image', 'url(' + users[index].image_url + ')')
        .appendTo(user_li);

        add_user(index + 1);
    }

    // Add dashboard <a> to the nav bar if it isn't already there
    var nav_a = $('nav [data-nav=dashboard]');
    if (nav_a.length === 0) {
      $('<a>')
        .attr('href', '#')
        .attr('data-nav', 'dashboard')
        .text('Dashboard')
        .appendTo('nav');
    }

    Pages.clear_page().done(function() {
      // Scroll up to the top
      if ($(window).scrollTop() > 0) {
        $('html, body').animate({
          scrollTop: 0
        });
      }

      if (hash === 'help') {
        Pages.render_help_page();
      } else if (hash.indexOf('bestseller-list-') === 0) {
        // Check if all the bestseller lists are loaded
        if (Cache.get_bestseller_lists().length === 0) {
          // Load all the bestseller lists before loading this page
          API.get_bestseller_lists().done(function() {
            var bestseller_list = Cache.get_bestseller_list_by_hash_name(hash);
            if (bestseller_list !== undefined) {
              Pages.render_bestseller_list_page(bestseller_list);
            } else {
              Pages.render_error_page();
            }
          });
        } else {
          var bestseller_list = Cache.get_bestseller_list_by_hash_name(hash);
          if (bestseller_list !== undefined) {
            Pages.render_bestseller_list_page(bestseller_list);
          } else {
            Pages.render_error_page();
          }
        }
      } else if (hash.indexOf('book-bag-') === 0) {
        var book_bag;
        for (var i = 0; i < user.book_bags.length; i++) {
          if (user.book_bags[i].hash_name === hash) {
            book_bag = user.book_bags[i];
            break;
          }
        }
        if (book_bag) {
          Pages.render_book_bag_page(book_bag);
        } else {
          Pages.render_error_page();
        }
      } else {
        Pages.render_dashboard_page(user);
      }
    });
  }
}

/**
 * http://stackoverflow.com/questions/985272/selecting-text-in-an-element-akin-to-highlighting-with-your-mouse
 */
function select_text(element) {
  var range, selection;

  if (document.body.createTextRange) {
    range = document.body.createTextRange();
    range.moveToElementText(element[0]);
    range.select();
  } else if (window.getSelection) {
    selection = window.getSelection();        
    range = document.createRange();
    range.selectNodeContents(element[0]);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}
