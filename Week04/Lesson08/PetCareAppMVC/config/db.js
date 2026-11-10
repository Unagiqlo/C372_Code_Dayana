const mysql = require('mysql2');

// MySQL Connection Pool
const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'RP_Cute17239@',
  database: 'petcare'
});

module.exports = connection;
