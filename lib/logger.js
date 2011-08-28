// request logger that uses loggly to store logs
var loggly = require( 'loggly' ),
    env = require( '../config/environment' );

exports.client = loggly.createClient({
  subdomain : "blindsey",
  auth : {
    username : "blindsey",
    password : "d0lph1n"
  }
});

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

  exports.client.log( env.loggly_input, payload, function( error ) {
    if( error ) console.log( "Loggly failure: " + error.message );
  });
};
