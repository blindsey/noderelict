var express = require( 'express' ),
    crypto = require( 'crypto' ),
    http = require( 'http' ),
    mongo = require( './lib/mongo' );

var app = express.createServer();

app.configure( function() {
  app.use( express.logger() );
  app.use( express.bodyParser() );
  app.use( express.static(__dirname + '/public') );
  app.use( express.errorHandler({ dumpExceptions: true, showStack: true }) );

  app.set( "views", __dirname + "/views/" );
  app.set( "view engine", "jade" );
  app.use( express.compiler( { src : __dirname + '/public', enable : [ 'less' ] } ) );
});

app.post( '/token', function( request, response ) {
  var email = request.param( 'email', null );
  if( !email ) {
    response.writeHead( 400, { 'Content-Type': 'text/plain' } );
    response.end( "NO EMAIL" );
    return;
  }

  var hash = crypto.createHash( 'md5' );
  hash.update( email );
  var digest = hash.digest( 'hex' );
  console.log( "Gravatar md5 " + digest );

  var client = http.createClient( 80, 'en.gravatar.com' );
  var client_request = client.request( 'GET', '/' + digest, {
    'host' : 'en.gravatar.com',
    'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.215 Safari/535.1'
  });
  client_request.end();
  client_request.on( 'response', function( client_response ) {
    console.log( "Gravatar location " + client_response.headers.location );
    if( client_response.headers.location === '/profiles/no-such-user' ) {
      response.writeHead( '404', { 'Content-Type': 'text/plain' } );
      response.end( "EMAIL NOT FOUND" );
    } else {
      mongo.find( 'users', { email : email }, function( error, item ) {
        if( item ) {
          response.writeHead( '200', { 'Content-Type': 'text/plain' } );
          response.end( item._id.toString() );
        } else {
          mongo.save( 'users', { email : email }, function( error, item ) {
            if( item ) {
              response.writeHead( '200', { 'Content-Type': 'text/plain' } );
              response.end( item._id.toString() );
            } else {
              response.writeHead( '500', { 'Content-Type': 'text/plain' } );
              response.end( error || 'Internal Server Error' );
            }
          });
        }
      });
    }
  });
});

app.get( '/', function( request, response ) {
  response.render( 'index' );
});

var port = process.env.PORT || 3000;
app.listen( port );
console.log( "Server started on port " + port );