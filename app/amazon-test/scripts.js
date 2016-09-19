var aws_host = 'ecs.amazonaws.com';
var aws_uri = '/onca/xml';
var aws_access_key_id = 'AKIAJIOHAZ7RBDBZRXTA';
var aws_secret_key = '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';
var aws_associate_tag = 'wwwlaurenzouc-20';

$(document).ready(function() {
  sign_aws_request();
});


/**
 * Using http://www.codediesel.com/php/accessing-amazon-product-advertising-api-in-php/ as a guide
 */
function sign_aws_request() {

  // Get the current timestamp in UTC
  var timestamp = moment.utc().format('YYYY-MM-DD\\THH:mm:ss\\Z');

  // Set the parameters
  var parameters = {
    Service: 'AWSECommerceService',
    AWSAccessKeyId: aws_access_key_id,
    AssociateTag: aws_associate_tag,
    Timestamp: timestamp,
    Version: '2009-03-31',

    Operation: 'ItemSearch',
    ResponseGroup: 'Small',
    SearchIndex: 'Books',
    Title: 'Harry Potter'
  };

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
      console.log(xml);
      console.log(xml.getElementsByTagName("query"));
    }
  );
}
