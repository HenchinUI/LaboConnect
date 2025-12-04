

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.postgresql://db_4c25_user:Oazer3XocCByWewoTZ6Xdo9uqquUYxtH@dpg-d4oou9idbo4c73f984rg-a/db_4c25,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = pool;
