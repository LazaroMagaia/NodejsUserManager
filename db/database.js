var mysql = require('mysql');
/**
 * DATABASE CONNECTION
 */
 var pool = mysql.createConnection({
   host     : 'localhost',
   user     : 'root',
   password : '',
   database : 'ncsoftware'
 });
 pool.connect(function(err) {
    if (err) {
      console.error('error connecting: ' + err.stack);
      return;
    }
    console.log('connectado com sucesso');
  });
  module.exports = pool;