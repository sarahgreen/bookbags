/**
 * ProgressBar handles the progress bar for the page.
 */
var ProgressBar = ProgressBar || {};

(function() {
  var current_percentage = 0;
  var progress_bar = $('#progress-bar');

  var loading = false;

  /**
   * Sets the progress bar at a given percentage.
   * Percentage should be given as an number between 0 and 100.
   * If percentage is 0 or if the progress bar is not already shown, the progress bar will automatically be shown.
   * If the percentage is 100, the progress bar will automatically fade away after a second.
   */
  this.set = function(percentage) {
    // Make sure that the input is between 0 and 100
    if (percentage < 0) {
      percentage = 0;
    } else if (percentage > 100) {
      percentage = 100;
    }

    // Show the progress bar if it's hidden
    if (!progress_bar.is(':visible')) {
      progress_bar.show();
    }

    // Set the progress bar the given percentage
    current_percentage = percentage;
    progress_bar.css('width', current_percentage + '%');

    // Fade away the progress bar after a second if the percentage is 100
    if (current_percentage === 100) {
      setTimeout(function() {
        progress_bar.fadeOut();
      }, 1000);
    }
  };

  /**
   * Adds a given percentage to the current progress bar percentage.
   * Percentage should be given as an number between 0 and 100.
   */
  this.add = function(percentage) {
    this.set(this.get() + percentage);
  };

  /**
   * Adds a random number between the given min and max to the progress bar.
   * This function is used to make the progress bar feel more realistic, so that we're not always adding a constant number to the progress bar.
   */
  this.add_random = function(min, max) {
    var percentage = Math.floor(Math.random() * (max - min + 1)) + min;
    this.add(percentage);
  };

  /*
   * Begin moving the progress bar forward.
   */
  this.start_loading = function(my_delay, my_max) {
    var self = this;
    var delay = 200; // time between jumps
    if (my_delay) {
      delay = my_delay;
    }
    var max = 100;
    if (my_max) {
      max = my_max;
    }
    if (!loading) { // prevent duplicates
      loading = true;
      self.set(0);
      var interval = window.setInterval(function() {
        self.add_random(2,20); // add random value
        // stop loading when the progress bar is full
        if (self.get() > max - 20) {
          window.clearInterval(interval);
          loading = false;
        }
      }, delay);
    }
  };

  /**
   * Returns the current percentage of the progress bar as a number between 0 and 100.
   */
  this.get = function() {
    return current_percentage;
  };
}).call(ProgressBar);
