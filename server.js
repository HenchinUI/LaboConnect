const express = require("express");
const path = require("path");
const db = require("./db"); // our PostgreSQL pool
const app = express();
const multer = require('multer');
const upload = multer({ dest: 'public/uploads/' }); // uploaded files will be stored in 'uploads' folder
const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);


// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));



// Test route
app.get("/api/test", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT NOW() AS time");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "components", "index.html"));
});


// Submit a new listing
app.post("/submit-listing", upload.single('image'), async (req, res) => {
  const { title, description, type, price, size } = req.body;
  const imageFile = req.file; // multer stores uploaded file info here

  if (!title || !description || !type || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let imageUrl = '';
  if (imageFile) {
    // save path to DB or upload to cloud storage
    imageUrl = `/uploads/${imageFile.filename}`;
  }

  try {
    const { rows } = await db.query(
      `INSERT INTO listings
        (title, description, type, price, size, image_url, approved, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, 'pending', NOW(), NOW())
       RETURNING *`,
      [title, description, type, price, size || '', imageUrl]
    );
    res.json({ message: "Listing submitted successfully!", listing: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all approved listings
app.get("/listings", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM listings WHERE approved = true ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin approve listing
app.post("/admin/approve-listing/:id", async (req, res) => {
  const listingId = req.params.id;
  try {
    await db.query(
      `UPDATE listings
       SET approved = true, status = 'approved', updated_at = NOW()
       WHERE id = $1`,
      [listingId]
    );
    res.json({ message: "Listing approved!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
 
app.get("/admin/listings", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, title, type, status, price, size, description, image_url, created_at
       FROM listings
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load listings" });
  }
});

// Reject a listing
app.post("/admin/listings/:id/reject", async (req, res) => {
  const listingId = req.params.id;
  try {
    await db.query(
      `UPDATE listings
       SET status = 'rejected', updated_at = NOW()
       WHERE id = $1`,
      [listingId]
    );
    res.json({ message: "Listing rejected" });
  } catch (err) {
    console.error("Reject listing error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get stats for admin dashboard
app.get("/admin/stats", async (req, res) => {
  try {
    const { rows: total } = await db.query("SELECT COUNT(*) FROM listings");
    const { rows: pending } = await db.query("SELECT COUNT(*) FROM listings WHERE status = 'pending'");
    const { rows: approved } = await db.query("SELECT COUNT(*) FROM listings WHERE status = 'approved'");
    
    res.json({
      total: parseInt(total[0].count),
      pending: parseInt(pending[0].count),
      approved: parseInt(approved[0].count)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});


app.get("/api/approved-listings", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, title, description, type, price, size, image_url FROM listings WHERE status = 'approved'"
    );

    res.json(result.rows);  // return JUST the array
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});




// Start server
app.listen(3000, () => console.log("Server running at http://localhost:3000"));
