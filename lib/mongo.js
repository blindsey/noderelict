var mongodb = require( 'mongodb' ),
    env = require( '../config/environment' );

var read_database, write_database;

// connect to the read database aka local slave with failover to the master
mongodb.connect( env.mongo_url_read, function( error, database ) {
  if( error ) {
    mongodb.connect( env.mongo_url_write, function( error, database ) {
      if( error ) throw error;
      read_database = database;
    });
  } else {
    read_database = database;
  }
});

// connect to the write database aka master
mongodb.connect( env.mongo_url_write, function( error, database ) {
  if( error ) throw error;
  write_database = database;
});

// error guard for properly propagating to the callback
function error_guard( handler, next ) {
  return function( error, arg ) {
    if( error ) handler( error );
    else next( arg );
  };
}

// apply the callback to the first document that matches the criteria
exports.find = function( collection, criteria, callback ) {
  read_database.collection( collection, error_guard( callback, function( collection ) {
    collection.findOne( criteria, { slaveOk : true }, error_guard( callback, function( document ) {
      callback( null, document );
    }));
  }));
};

// apply the callback across all documents that match the criteria
exports.all = function( collection, criteria, callback ) {
  read_database.collection( collection, error_guard( callback, function( collection ) {
    collection.find( criteria, { slaveOk : true }, error_guard( callback, function( cursor ) {
      cursor.each( error_guard( callback, function( document ) {
        if( document ) callback( null, document );
      }));
    }));
  }));
};

// insert the document into the collection if it has no _id, upsert otherwise
exports.save = function( collection, document, callback ) {
  mongodb.connect( env.mongo_url_write, error_guard( callback, function( db ) {
    db.collection( collection, error_guard( callback, function( collection ) {
      collection.save( document, { safe : true }, error_guard( callback, function() {
        callback();
      }));
    }));
  }));
};

// upsert the document into the collection
exports.update = function( collection, criteria, document, callback ) {
  mongodb.connect( env.mongo_url_write, error_guard( callback, function( db ) {
    db.collection( collection, error_guard( callback, function( collection ) {
      collection.update( criteria, document, { safe : true }, error_guard( callback, function() {
        callback();
      }));
    }));
  }));
};

exports.objectify = mongodb.BSONPure.ObjectID;
