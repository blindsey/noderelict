// request logger that uses loggly to store logs
var loggly = require( 'loggly' );

var config = {
  subdomain : "blindsey",
  auth : {
    username : "blindsey",
    password : "d0lph1n"
  },
  input : 'd4d530c7-b244-4f88-898b-a9fd67e7e7ea'
};

exports.client = loggly.createClient( config );

exports.log_request = function( request, error ) {
  var payload = {
    remoteAddress: request.headers['x-forwarded-for'] || request.connection.remoteAddress,
    method: request.method,
    url: request.url,
    referer: request.headers['referer'],
    userAgent: request.headers['user-agent'],
    sessionID: request.sessionID,
    token: request.param( 'token', null )
  };
  if( error ) payload.error = error;

  exports.client.log( config.input, payload, function( error ) {
    if( error ) console.log( "Loggly exception: " + error.message );
  });
};
