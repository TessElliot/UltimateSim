// postgres.cjs

const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "Root12345@",
  database: "newyork",
  port: 5432, // Postgres default port
});

module.exports = pool;
