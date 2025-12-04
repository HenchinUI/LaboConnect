const pool = require("./db"); // your pool file

(async () => {
  try {
    const res = await pool.query("SELECT * FROM listings");
    console.log(res.rows);
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    pool.end();
  }
})();
