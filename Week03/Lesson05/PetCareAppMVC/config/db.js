const mysql = require('mysql2');

// MySQL Connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'RP_Cute17239@',
  database: 'petcare'
});

module.exports = connection;
