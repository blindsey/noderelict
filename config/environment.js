var CONFIG = {
  development : {
    loggly_input : '17932b8c-5f82-4b17-8977-f5867cf9829f',
    mongo_url_read : 'mongodb://localhost/development',
    mongo_url_write : 'mongodb://localhost/development'
  },

  production : {
    loggly_input : 'd4d530c7-b244-4f88-898b-a9fd67e7e7ea',
    mongo_url_read : 'mongodb://localhost/production',
    mongo_url_write : 'mongodb://db01/production'
  }
};

module.exports = CONFIG[ process.env.NODE_ENV || 'development' ];
