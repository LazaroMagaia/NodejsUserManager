var mysql = require('mysql');
/**
 * DATABASE CONNECTION
 */
 var pool = mysql.createConnection({
   host     : process.env.HOST,
   user     : process.env.USER,
   password : process.env.PASSWORD,
   database : process.env.DB
 });
 pool.connect(function(err) {
    if (err) {
      console.error("Erro ao connectar ao banco de dados");
      return;
    }
    console.log('banco de dados connectado com sucesso');
  });
  module.exports = pool;