var express = require('express');

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
  console.log( "EMAIL: " + request.param.email );
  response.writeHead( 200, { 'Content-Type': 'text/plain' } );
  response.end( "OK" );
});

app.get( '/', function( request, response ) {
  response.render( 'index' );
});

var port = process.env.PORT || 3000;
app.listen( port );
console.log( "Server started on port " + port );
