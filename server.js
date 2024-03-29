var express = require( 'express' ),
    crypto = require( 'crypto' ),
    http = require( 'http' ),
    mongo = require( './lib/mongo' ),
    logger = require( './lib/logger' );

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

function log( request, response, next ) {
  logger.log_request( request );
  next();
}

process.on( "uncaughtException", function( error ) {
  console.error( "Uncaught exception: " + error.message );
  console.trace();
});

app.get( '/', function( request, response ) {
  response.render( 'index' );
});

app.get( '/graphs/:token', function( request, response ) {
  response.render( 'graphs', { token : request.param( 'token' ) } );
});

app.get( '/graphs/:token/total', function( request, response ) {
  var data = [];
  mongo.all( 'logs', { token : mongo.objectify( request.param( 'token' ) ) }, function( error, item ) {
    if( error ) {
      response.writeHead( 500, { 'Content-Type' : 'text/plain' } );
      response.end( JSON.stringify( error ) );
    } else if( item ) {
      var ts = item.timestamp || new Date();
      data.push( [ ts.getTime(), item.totalTime ] );
    } else {
      response.writeHead( 200, { 'Content-Type' : 'application/json' } );
      response.end( JSON.stringify( data ) );
    }
  });
});

/*
var io = require( 'socket.io' ).listen( app );
io.set( 'log level', 2 );
io.sockets.on( 'connection', function( socket ) {
  console.log( 'connection' );
  socket.on( 'poll', function( graph ) {
    console.log( 'poll ' + JSON.stringify( graph ) );
    var data = [];
    mongo.all( 'logs', { token : mongo.objectify( graph.token ) }, function( error, item ) {
      if( error ) {
        socket.emit( 'error', JSON.stringify( error ) );
      } else if( item ) {
        data.push( [ item.timestamp, item.totalTime ] );
      } else {
        socket.emit( 'message', data );
      }
    });
  });
});
*/

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

  var client = http.createClient( 80, 'en.gravatar.com' );
  var client_request = client.request( 'GET', '/' + digest, {
    'host' : 'en.gravatar.com',
    'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.215 Safari/535.1'
  });
  client_request.end();
  client_request.on( 'response', function( client_response ) {
    console.log( "User " + email + " => gravatar.com" + client_response.headers.location );
    if( client_response.headers.location === '/profiles/no-such-user' ) {
      response.writeHead( '404', { 'Content-Type': 'text/plain' } );
      response.end( "EMAIL NOT FOUND" );
    } else {
      mongo.save( 'users', { email : email }, function( error ) {
        if( error ) {
          response.writeHead( '500', { 'Content-Type': 'text/plain' } );
          response.end( error.message );
        } else {
          mongo.find( 'users', { email : email }, function( error, item ) {
            if( item ) {
              response.writeHead( '200', { 'Content-Type': 'text/plain' } );
              response.end( item._id.toString() );
            } else {
              response.writeHead( '500', { 'Content-Type': 'text/plain' } );
              response.end( error || 'INTERNAL SERVER ERROR' );
            }
          });
        }
      });
    }
  });
});

app.post( "/log", log, function( request, response ) {
  console.log( "log" );
  var token = request.param( 'token', null );
  if( !token ) {
    response.writeHead( '400', { 'Content-Type': 'text/plain' } );
    response.end( "NO TOKEN" );
    return;
  }

  token = mongo.objectify( token );
  mongo.find( 'users', { _id : token }, function( error, item ) {
    if( !item ) {
      response.writeHead( '404', { 'Content-Type': 'text/plain' } );
      response.end( "INVALID TOKEN" );
    } else {
      var payload = request.param( 'payload', '{}' );
      console.log( payload );
      payload = JSON.parse( payload );
      payload.timestamp = new Date();
      payload.token = token;
      mongo.save( 'logs', payload, function( error, item ) {
        response.writeHead( '200', { 'Content-Type': 'text/plain' } );
        response.end( "OK" );
      });
    }
  });
});

var port = process.env.PORT || 3000;
app.listen( port );
console.log( "Server started on port " + port );
