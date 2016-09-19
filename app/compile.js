var INPUT_DIRECTORY = 'assets/less/';
var OUTPUT_DIRECTORY = 'assets/css/';

var fs = require('fs'); // for file system manipulation
var watch = require('node-watch'); // for watching files
var q = require('q'); // for promises and defers

var less = require('less'); // for compiling LESS

var autoprefixer = require('autoprefixer-core'); // for autoprefixer
var processor = autoprefixer({ browsers: ['> 1%'], cascade: false}); // Autoprefixer processor

// Get LESS files
get_less_files(INPUT_DIRECTORY).then(function(less_files) {
  
  // Watch the LESS files
  watch(less_files, function(less_file_name) {
    process_less_file(INPUT_DIRECTORY + 'styles.less');
  });
  
}, function(error) {
  console.log(error);
});

/**
 * Processes a LESS file by converting it to a CSS file.
 */
function process_less_file(less_file_name) {
  log('Processing ' + less_file_name);

  q.fcall(read_less_from_file, less_file_name)
  .then(compile_less_to_css)
  .then(prefix_css)
  .then(function(prefixed_css_data) {
    write_css_to_file(less_file_name, prefixed_css_data);
  }).catch(function(error) {
    console.log(error);
  }).done();
}

/**
 * Retrieves all the LESS files from a directory.
 */
function get_less_files(directory) {
  log('Retrieving LESS files from ' + directory);

  var defer = q.defer();

  fs.readdir(directory, function(error, files) {
    if (error) {
      defer.reject(error);
    } else {

      // Make sure that we only consider .less files
      get_only_less_files(files, 0, []);
    }
  });

  /**
   * Returns an array with only .less files from an array of files.
   */
  function get_only_less_files(files, file_index, less_files) {
    if (file_index === files.length) {
      defer.resolve(less_files);
    } else {
      var file = files[file_index];
      if (file.indexOf('.less', file.length - '.less'.length) !== -1) {
        less_files.push(directory + file);
      }

      get_only_less_files(files, file_index + 1, less_files);
    }
  }

  return defer.promise;
}

/**
 * Compiles a string of LESS data to a minified string of CSS data.
 */
function compile_less_to_css(less_data) {
  log('Compiling LESS to CSS');

  var defer = q.defer();

  less.render(less_data, {
      paths: [INPUT_DIRECTORY],
      compress: true
    }, function(error, css_tree) {
    if (error) {
      defer.reject(error);
    } else {
      try {
        var css_data = css_tree.css;
        defer.resolve(css_data);
      } catch(exception) {
        defer.reject(exception);
      }
    }
  });

  return defer.promise;
}

/**
 * Adds prefixes to CSS data so that the CSS is cross-browser compatible.
 */
function prefix_css(css_data) {
  log('Prefixing the CSS');
  return q.resolve(processor.process(css_data).css);
}

/**
 * Reads LESS data from a .less file and returns the LESS data in a string.
 */
function read_less_from_file(less_file_name) {
  log('Reading ' + less_file_name);

  var defer = q.defer();

  fs.readFile(less_file_name, 'utf8', function(error, less_data) {
    if (error) {
      defer.reject(error);
    } else {
      defer.resolve(less_data);
    }
  });

  return defer.promise;
}

/**
 * Writes the CSS data compiled from a .less file to a .css file.
 */
function write_css_to_file(less_file_name, css_data) {
  var file_name = less_file_name.replace(/^.*[\\\/]/, '');
  var css_file_name = OUTPUT_DIRECTORY + file_name.substr(0, file_name.length - '.less'.length) + '.css';

  log('Writing to ' + css_file_name);

  fs.writeFile(css_file_name, css_data, function(error) {
    if (error) {
      console.log(error);
    } else {
      log(css_file_name + ' was saved!');
    }
  });
}

/**
 * Logs a message to the console with the timestamp.
 */
function log(message) {
  var time = new Date();
  var time_str = time.toLocaleTimeString("en-US");

  console.log('[' + time_str + '] ' + message);
}