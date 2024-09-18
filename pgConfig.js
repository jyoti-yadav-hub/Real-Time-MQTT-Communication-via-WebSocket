const { Pool } = require("pg");

// Replace these with your PostgreSQL connection details
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Jyoti-demo",
  password: "root",
  port: 5432, // Default PostgreSQL port
});

module.exports = pool;
