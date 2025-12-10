try {
  require('dotenv').config();
} catch (e) {
  console.warn('dotenv not installed; skipping .env load');
}
const express = require("express");
const path = require("path");
const db = require("./db"); // PostgreSQL pool
const app = express();
const http = require('http');
const { Server: IOServer } = require('socket.io');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const crypto = require('crypto');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configure multer to preserve original file extensions when saving
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '';
    const unique = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    cb(null, unique + ext);
  }
});

const upload = multer({ storage });
const uploadMultiple = multer({ storage });

// -------------------
// Middleware
// -------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  store: new pgSession({
    pool: db,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'labo-connect-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production' ? true : false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Protect access to the admin dashboard HTML even if someone tries to hit the static file directly.
// Allowed roles can be adjusted as needed. Currently allowing 'admin' and 'standard'.
const _adminProtectedPaths = [
  '/components/admin-dashboard.html',
  '/components/admin-dashboard',
  '/admin-dashboard',
  '/admin-dashboard.html'
];
app.use((req, res, next) => {
  try {
    if (_adminProtectedPaths.includes(req.path)) {
      const sessionUser = req.session && req.session.user;
      const allowed = sessionUser && (sessionUser.role === 'admin' || sessionUser.role === 'standard');
      if (!allowed) {
        // If the request expects HTML, return a small HTML response; otherwise return JSON error.
        if (req.accepts('html')) return res.status(403).send('Forbidden');
        return res.status(403).json({ error: 'Forbidden' });
      }
    }
  } catch (e) {
    console.warn('Admin protect middleware error', e);
  }
  return next();
});

app.use(express.static(path.join(__dirname, "public")));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

// We'll create the HTTP server later and attach socket.io to it.
let io = null;

// -------------------
// Test Route
// -------------------
app.get("/api/test", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT NOW() AS time");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// -------------------
// Home Page
// -------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "components", "index.html"));
});

// -------------------
// Protected Admin Dashboard Route
// -------------------
app.get('/admin-dashboard', (req, res) => {
  const sessionUser = req.session && req.session.user;
  if (!sessionUser) {
    // Not authenticated: redirect to home/login (avoid exposing admin file)
    return res.redirect('/');
  }
  if (sessionUser.role !== 'admin') {
    return res.status(403).send('Forbidden');
  }
  return res.sendFile(path.join(__dirname, 'public', 'components', 'admin-dashboard.html'));
});

// -------------------
// User Registration
// -------------------
app.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Please fill all required fields" });
  }

  try {
    // If registering as admin, require a valid admin token
    if (role === 'admin') {
      const token = req.body.admin_token;
      if (!token) return res.status(400).json({ error: 'Admin token is required to register as admin' });

      // ensure admin_tokens table exists
      try {
        await db.query(`CREATE TABLE IF NOT EXISTS admin_tokens (
          id SERIAL PRIMARY KEY,
          token TEXT UNIQUE NOT NULL,
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          expires_at TIMESTAMP,
          used BOOLEAN DEFAULT FALSE,
          used_by INTEGER,
          used_at TIMESTAMP
        )`);
      } catch (e) {
        console.warn('Could not ensure admin_tokens table exists:', e.message || e);
      }

      const { rows: matching } = await db.query('SELECT * FROM admin_tokens WHERE token = $1 LIMIT 1', [token]);
      if (matching.length === 0) return res.status(400).json({ error: 'Invalid admin token' });
      const tk = matching[0];
      if (tk.used) return res.status(400).json({ error: 'Admin token already used' });
      if (tk.expires_at && new Date(tk.expires_at) < new Date()) return res.status(400).json({ error: 'Admin token expired' });
      // token is valid; we'll mark it used after creating the user
    }
    // Check if user exists
    const { rows: existing } = await db.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const { rows } = await db.query(
      `INSERT INTO users (username, email, password, role) 
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, created_at`,
      [username, email, hashedPassword, role || 'user']
    );

    // If admin token was used, mark it as used and associated with this user
    if (role === 'admin') {
      try {
        await db.query('UPDATE admin_tokens SET used = TRUE, used_by = $1, used_at = NOW() WHERE token = $2', [rows[0].id, req.body.admin_token]);
      } catch (e) {
        console.warn('Could not mark admin token as used:', e.message || e);
      }
    }

    // Establish server-side session for the newly created user so they are authenticated immediately
    try {
      req.session.user = { id: rows[0].id, username: rows[0].username, email: rows[0].email, role: rows[0].role };
    } catch (e) {
      console.warn('Could not set session for new user:', e && e.message ? e.message : e);
    }

    res.status(201).json({ message: "User registered successfully!", user: { id: rows[0].id, username: rows[0].username, email: rows[0].email, role: rows[0].role } });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------
// User Login
// -------------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Please provide email and password" });
  }

  try {
    const { rows } = await db.query("SELECT * FROM users WHERE email = $1", [email]);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Store user in server-side session
    req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role };

    // Return user info including role
    res.json({
      message: "Login successful!",
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------
// Session Validation (get current user from server-side session)
// -------------------
app.get("/api/session", (req, res) => {
  if (req.session.user) {
    res.json({ authenticated: true, user: req.session.user });
  } else {
    res.json({ authenticated: false, user: null });
  }
});

// -------------------
// Profile Management
// -------------------

// Get user profile (private - own profile with stats)
app.get('/api/profile/:userId', async (req, res) => {
  try {
    const sessionUser = req.session && req.session.user;
    if (!sessionUser || parseInt(req.params.userId) !== sessionUser.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userId = req.params.userId;

    // Ensure profile columns exist
    try {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_number TEXT`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT`);
    } catch (e) {
      console.warn('Could not add profile columns:', e.message);
    }

    // Get user profile
    const { rows: users } = await db.query(
      'SELECT id, username, email, contact_number, bio, profile_picture_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get listings count
    const { rows: listings } = await db.query(
      'SELECT COUNT(*) as count FROM listings WHERE owner_id = $1 AND status = $2',
      [userId, 'approved']
    );

    // Get inquiries count (received by owner)
    const { rows: inquiries } = await db.query(
      'SELECT COUNT(*) as count FROM inquiries WHERE owner_id = $1',
      [userId]
    );

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      contact_number: user.contact_number,
      bio: user.bio,
      profile_picture_url: user.profile_picture_url,
      created_at: user.created_at,
      listings_count: parseInt(listings[0].count),
      inquiries_count: parseInt(inquiries[0].count)
    });
  } catch (e) {
    console.error('Error fetching profile:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
app.put('/api/profile/:userId', async (req, res) => {
  try {
    const sessionUser = req.session && req.session.user;
    if (!sessionUser || parseInt(req.params.userId) !== sessionUser.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userId = req.params.userId;
    const { username, email, contact_number, bio } = req.body;

    // Validation
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }

    // Ensure profile columns exist
    try {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_number TEXT`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);
    } catch (e) {
      console.warn('Could not add profile columns:', e.message);
    }

    // Check if email is already taken by another user
    const { rows: existingEmail } = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );

    if (existingEmail.length > 0) {
      return res.status(400).json({ error: 'Email is already in use' });
    }

    // Update user
    const { rows: updated } = await db.query(
      'UPDATE users SET username = $1, email = $2, contact_number = $3, bio = $4 WHERE id = $5 RETURNING id, username, email, contact_number, bio, created_at',
      [username, email, contact_number || null, bio || null, userId]
    );

    if (updated.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update session
    req.session.user = {
      ...req.session.user,
      username: updated[0].username,
      email: updated[0].email
    };

    // Get updated stats
    const { rows: listings } = await db.query(
      'SELECT COUNT(*) as count FROM listings WHERE owner_id = $1 AND status = $2',
      [userId, 'approved']
    );

    const { rows: inquiries } = await db.query(
      'SELECT COUNT(*) as count FROM inquiries WHERE owner_id = $1',
      [userId]
    );

    res.json({
      id: updated[0].id,
      username: updated[0].username,
      email: updated[0].email,
      contact_number: updated[0].contact_number,
      bio: updated[0].bio,
      created_at: updated[0].created_at,
      listings_count: parseInt(listings[0].count),
      inquiries_count: parseInt(inquiries[0].count)
    });
  } catch (e) {
    console.error('Error updating profile:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload profile picture
app.post('/api/profile/:userId/picture', upload.single('profile_picture'), async (req, res) => {
  try {
    const sessionUser = req.session && req.session.user;
    if (!sessionUser || parseInt(req.params.userId) !== sessionUser.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const userId = req.params.userId;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Ensure profile column exists
    try {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT`);
    } catch (e) {
      console.warn('Could not add profile_picture_url column:', e.message);
    }

    // Store file path
    const profilePictureUrl = `/uploads/${req.file.filename}`;

    // Update user profile picture
    const { rows: updated } = await db.query(
      'UPDATE users SET profile_picture_url = $1 WHERE id = $2 RETURNING profile_picture_url',
      [profilePictureUrl, userId]
    );

    if (updated.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      profile_picture_url: updated[0].profile_picture_url
    });
  } catch (e) {
    console.error('Error uploading profile picture:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get public user profile (anyone can view)
app.get('/api/profile/:userId/public', async (req, res) => {
  try {
    const userId = req.params.userId;

    // Ensure profile columns exist
    try {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_number TEXT`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT`);
    } catch (e) {
      console.warn('Could not add profile columns:', e.message);
    }

    // Get user profile (without email)
    const { rows: users } = await db.query(
      'SELECT id, username, contact_number, bio, profile_picture_url, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    // Get listings count
    const { rows: listings } = await db.query(
      'SELECT COUNT(*) as count FROM listings WHERE owner_id = $1 AND status = $2',
      [userId, 'approved']
    );

    res.json({
      id: user.id,
      username: user.username,
      contact_number: user.contact_number,
      bio: user.bio,
      profile_picture_url: user.profile_picture_url,
      created_at: user.created_at,
      listings_count: parseInt(listings[0].count)
    });
  } catch (e) {
    console.error('Error fetching public profile:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's listings (for public profile)
app.get('/api/user/:userId/listings', async (req, res) => {
  try {
    const userId = req.params.userId;

    const { rows: listings } = await db.query(
      'SELECT id, title, description, price, size_sqm, image_url FROM listings WHERE owner_id = $1 AND status = $2 ORDER BY created_at DESC LIMIT 6',
      [userId, 'approved']
    );

    res.json(listings);
  } catch (e) {
    console.error('Error fetching user listings:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's listings by status (for profile page)
app.get('/api/my-listings/:status', async (req, res) => {
  const sessionUser = req.session && req.session.user;
  if (!sessionUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { status } = req.params;
  const validStatuses = ['pending', 'approved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    // Ensure rejection_reason column exists
    try {
      await db.query(`ALTER TABLE listings ADD COLUMN IF NOT EXISTS rejection_reason TEXT`);
    } catch (e) {
      console.warn('Could not add rejection_reason column:', e.message);
    }

    const { rows: listings } = await db.query(
      `SELECT id, title, description, price, size_sqm, image_url, status, created_at, updated_at, type, 
              owner_first_name, owner_last_name, latitude, longitude, rejection_reason 
       FROM listings 
       WHERE owner_id = $1 AND status = $2 
       ORDER BY created_at DESC`,
      [sessionUser.id, status]
    );

    res.json(listings);
  } catch (e) {
    console.error('Error fetching user listings:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update listing details
app.put('/api/my-listings/:listingId', async (req, res) => {
  const sessionUser = req.session && req.session.user;
  if (!sessionUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { listingId } = req.params;
  const { title, description, price, size_sqm, type } = req.body;

  try {
    // Verify user owns this listing
    const { rows: listing } = await db.query(
      'SELECT owner_id FROM listings WHERE id = $1',
      [listingId]
    );

    if (!listing.length) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing[0].owner_id !== sessionUser.id) {
      return res.status(403).json({ error: 'You do not own this listing' });
    }

    // Update listing
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (title !== undefined) {
      updateFields.push(`title = $${paramCount++}`);
      updateValues.push(title);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramCount++}`);
      updateValues.push(description);
    }
    if (price !== undefined) {
      updateFields.push(`price = $${paramCount++}`);
      updateValues.push(price);
    }
    if (size_sqm !== undefined) {
      updateFields.push(`size_sqm = $${paramCount++}`);
      updateValues.push(size_sqm);
    }
    if (type !== undefined) {
      updateFields.push(`type = $${paramCount++}`);
      updateValues.push(type);
    }

    updateFields.push(`updated_at = $${paramCount++}`);
    updateValues.push(new Date());
    updateValues.push(listingId);

    const sql = `UPDATE listings SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const { rows } = await db.query(sql, updateValues);

    res.json({ message: 'Listing updated', listing: rows[0] });
  } catch (e) {
    console.error('Error updating listing:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete listing (user can delete their own)
app.delete('/api/my-listings/:listingId', async (req, res) => {
  const sessionUser = req.session && req.session.user;
  if (!sessionUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { listingId } = req.params;

  try {
    // Verify user owns this listing
    const { rows: listing } = await db.query(
      'SELECT owner_id, image_url FROM listings WHERE id = $1',
      [listingId]
    );

    if (!listing.length) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing[0].owner_id !== sessionUser.id) {
      return res.status(403).json({ error: 'You do not own this listing' });
    }

    // Delete related records first
    try { await db.query('DELETE FROM messages WHERE inquiry_id IN (SELECT id FROM inquiries WHERE listing_id = $1)', [listingId]); } catch (e) { console.warn('Could not delete messages:', e.message); }
    try { await db.query('DELETE FROM inquiries WHERE listing_id = $1', [listingId]); } catch (e) { console.warn('Could not delete inquiries:', e.message); }
    try { await db.query('DELETE FROM uploads_meta WHERE listing_id = $1', [listingId]); } catch (e) { console.warn('Could not delete uploads_meta:', e.message); }
    try { await db.query('DELETE FROM user_listings WHERE listing_id = $1', [listingId]); } catch (e) { console.warn('Could not delete user_listings:', e.message); }

    // Delete the listing
    await db.query('DELETE FROM listings WHERE id = $1', [listingId]);

    res.json({ message: 'Listing deleted successfully' });
  } catch (e) {
    console.error('Error deleting listing:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload/replace listing image
app.post('/api/my-listings/:listingId/image', upload.single('image'), async (req, res) => {
  const sessionUser = req.session && req.session.user;
  if (!sessionUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No image provided' });
  }

  const { listingId } = req.params;

  try {
    // Verify user owns this listing
    const { rows: listing } = await db.query(
      'SELECT owner_id, image_url FROM listings WHERE id = $1',
      [listingId]
    );

    if (!listing.length) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing[0].owner_id !== sessionUser.id) {
      return res.status(403).json({ error: 'You do not own this listing' });
    }

    // Delete old image if exists
    if (listing[0].image_url) {
      const oldPath = path.join(__dirname, 'public', listing[0].image_url);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const newImageUrl = `/uploads/${req.file.filename}`;

    // Update listing with new image
    const { rows } = await db.query(
      'UPDATE listings SET image_url = $1, updated_at = $2 WHERE id = $3 RETURNING *',
      [newImageUrl, new Date(), listingId]
    );

    res.json({ message: 'Image updated', listing: rows[0] });
  } catch (e) {
    console.error('Error updating listing image:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search users
app.get('/api/users/search', async (req, res) => {
  try {
    // Ensure profile columns exist
    try {
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS contact_number TEXT`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT`);
      await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_picture_url TEXT`);
    } catch (e) {
      console.warn('Could not add profile columns:', e.message);
    }

    // Get all users with their profile info and listing counts (excluding email for privacy)
    const { rows: users } = await db.query(`
      SELECT 
        u.id, 
        u.username, 
        u.contact_number, 
        u.bio, 
        u.profile_picture_url,
        u.created_at,
        COALESCE(COUNT(DISTINCT l.id), 0) as listings_count
      FROM users u
      LEFT JOIN listings l ON u.id = l.owner_id AND l.status = 'approved'
      GROUP BY u.id, u.username, u.contact_number, u.bio, u.profile_picture_url, u.created_at
      ORDER BY u.username ASC
    `);

    res.json(users);
  } catch (e) {
    console.error('Error searching users:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------
app.post('/api/admin/tokens', async (req, res) => {
  try {
    const sessionUser = req.session && req.session.user;
    if (!sessionUser || sessionUser.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    // ensure table exists
    try {
      await db.query(`CREATE TABLE IF NOT EXISTS admin_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP,
        used BOOLEAN DEFAULT FALSE,
        used_by INTEGER,
        used_at TIMESTAMP
      )`);
    } catch (e) {
      console.warn('Could not ensure admin_tokens table exists:', e.message || e);
    }

    // generate a secure random token
    const raw = crypto.randomBytes(20).toString('hex');
    const token = raw;

    // optional expires_in_days
    let expiresAt = null;
    if (req.body && req.body.expires_in_days) {
      const days = parseInt(req.body.expires_in_days) || 0;
      if (days > 0) expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    const insertSql = 'INSERT INTO admin_tokens (token, created_by, expires_at) VALUES ($1,$2,$3) RETURNING id, token, created_at, expires_at';
    const { rows } = await db.query(insertSql, [token, sessionUser.id || null, expiresAt]);

    res.json({ message: 'Token created', token: rows[0].token, expires_at: rows[0].expires_at });
  } catch (err) {
    console.error('Create admin token error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------
// Logout (clear server-side session)
// -------------------
app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "Logout failed" });
    }
    res.json({ message: "Logged out successfully" });
  });
});

// -------------------
// Listing Routes
// -------------------
// Submit Listing (Updated with new fields and multiple file uploads)
// -------------------
app.post("/submit-listing", uploadMultiple.fields([
  { name: 'image', maxCount: 1 },
  { name: 'oct_tct', maxCount: 1 },
  { name: 'tax_declaration', maxCount: 1 },
  { name: 'doas', maxCount: 1 },
  { name: 'government_id', maxCount: 1 }
]), async (req, res) => {
  // Only authenticated users may submit a listing
  const sessionUser = req.session && req.session.user;
  if (!sessionUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Only allow business or admin roles to submit listings
  if (!sessionUser.role || (sessionUser.role !== 'business' && sessionUser.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden: only business or admin accounts may submit listings' });
  }

  const { 
    owner_name, 
    title, 
    description, 
    type, 
    price, 
    size_sqm,
    latitude,
    longitude,
    user_id
  } = req.body;
  
  const files = req.files || {};

  // Validate required fields
  if (!owner_name || !title || !description || !type || !price) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Get file URLs
  const imageUrl = files.image ? `/uploads/${files.image[0].filename}` : '';
  const octTctUrl = files.oct_tct ? `/uploads/${files.oct_tct[0].filename}` : '';
  const taxDeclarationUrl = files.tax_declaration ? `/uploads/${files.tax_declaration[0].filename}` : '';
  const doasUrl = files.doas ? `/uploads/${files.doas[0].filename}` : '';
  const governmentIdUrl = files.government_id ? `/uploads/${files.government_id[0].filename}` : '';

  try {
    // Check whether latitude/longitude columns exist in the listings table
    const { rows: cols } = await db.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = $1 AND column_name = ANY($2)`,
      ['listings', ['latitude', 'longitude']]
    );
    const existingCols = cols.map(r => r.column_name);

    // Build insert dynamically depending on available columns
    const insertCols = [
      'owner_name','title','description','type','price','size_sqm'
    ];
    const values = [owner_name, title, description, type, price, size_sqm || null];
    
    // Add owner_id if provided (from logged-in user)
    // Prefer server-side session user id to prevent spoofing
    const submitterId = sessionUser && sessionUser.id ? sessionUser.id : (user_id ? parseInt(user_id) : null);
    if (submitterId) {
      insertCols.push('owner_id');
      values.push(parseInt(submitterId));
    }

    if (existingCols.includes('latitude')) {
      insertCols.push('latitude');
      values.push(latitude ? parseFloat(latitude) : null);
    }
    if (existingCols.includes('longitude')) {
      insertCols.push('longitude');
      values.push(longitude ? parseFloat(longitude) : null);
    }

    // file URL columns
    insertCols.push('image_url','oct_tct_url','tax_declaration_url','doas_url','government_id_url','approved','status','created_at','updated_at');
    values.push(imageUrl, octTctUrl, taxDeclarationUrl, doasUrl, governmentIdUrl, false, 'pending', new Date(), new Date());

    const placeholders = insertCols.map((_, i) => `$${i+1}`).join(', ');
    const sql = `INSERT INTO listings (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING *`;

    const { rows } = await db.query(sql, values);
    const listing = rows[0];
    
    // If owner_id provided, link it in user_listings table
    if (user_id) {
      try {
        await db.query(`CREATE TABLE IF NOT EXISTS user_listings (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          listing_id INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(user_id, listing_id)
        )`);
        await db.query(
          'INSERT INTO user_listings (user_id, listing_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [parseInt(user_id), listing.id]
        );
      } catch (e) {
        console.warn('Could not link user_listings:', e.message || e);
      }
    }

    // store upload metadata (original filename -> stored filename)
    try {
      await db.query(`CREATE TABLE IF NOT EXISTS uploads_meta (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER,
        field_name TEXT,
        stored_filename TEXT,
        original_filename TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )`);

      const fileFields = ['image','oct_tct','tax_declaration','doas','government_id'];
      for (const f of fileFields) {
        if (files[f] && files[f][0]) {
          const stored = files[f][0].filename;
          const original = files[f][0].originalname || stored;
          await db.query(`INSERT INTO uploads_meta (listing_id, field_name, stored_filename, original_filename) VALUES ($1,$2,$3,$4)`, [listing.id, f, stored, original]);
        }
      }
    } catch (e) {
      console.warn('Could not save uploads_meta:', e.message || e);
    }

    res.json({ message: "Listing submitted successfully!", listing: rows[0] });
  } catch (err) {
    console.error('Submit listing error:', err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Inquiries: investors can send inquiry to listing owner (wired to user accounts)
app.post('/api/inquiries', async (req, res) => {
  const { listing_id, full_name, contact_number, email, company, message, sender_user_id } = req.body;
  if (!listing_id || !full_name || !contact_number || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // ensure inquiries table exists
    await db.query(`CREATE TABLE IF NOT EXISTS inquiries (
      id SERIAL PRIMARY KEY,
      listing_id INTEGER,
      sender_user_id INTEGER,
      full_name TEXT,
      contact_number TEXT,
      email TEXT,
      company TEXT,
      message TEXT,
      owner_id INTEGER,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // fetch listing to validate owner and increment inquiries
    const { rows: listings } = await db.query('SELECT * FROM listings WHERE id = $1 LIMIT 1', [listing_id]);
    if (listings.length === 0) return res.status(404).json({ error: 'Listing not found' });
    const listing = listings[0];

    // prevent owner submitting inquiry for their own listing (by user_id if available, fallback to name)
    const ownerName = (listing.owner_name || '').trim().toLowerCase();
    const senderName = (full_name || '').trim().toLowerCase();
    if (ownerName && senderName && ownerName === senderName) {
      return res.status(400).json({ error: "Owner cannot send inquiry to their own listing" });
    }

    const insert = await db.query(
      `INSERT INTO inquiries (listing_id, sender_user_id, full_name, contact_number, email, company, message, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [listing_id, sender_user_id || null, full_name, contact_number, email, company || null, message || null, listing.owner_id || null]
    );

    const inquiry = insert.rows[0];

    // increment inquiries counter on listings table
    try {
      await db.query(`UPDATE listings SET inquiries = COALESCE(inquiries,0) + 1 WHERE id = $1`, [listing_id]);
    } catch (e) {
      console.warn('Could not increment inquiries count:', e.message || e);
    }

    // Send email notification if owner has opted in and owner_id exists
    if (listing.owner_id) {
      try {
        const { rows: prefs } = await db.query('SELECT * FROM notification_preferences WHERE user_id = $1', [listing.owner_id]);
        const shouldNotify = prefs.length === 0 || prefs[0].email_new_inquiry !== false;
        if (shouldNotify) {
          sendInquiryNotificationEmail(inquiry, listing, listing.owner_id);
        }
      } catch (e) {
        console.warn('Could not check notification preferences:', e.message || e);
      }
    }

    res.status(201).json({ message: 'Inquiry sent', inquiry });
  } catch (err) {
    console.error('Inquiry error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET inquiries - optional filters: listing_id, owner_id, listing_owner (backward compat)
app.get('/api/inquiries', async (req, res) => {
  try {
    // Only authenticated users may list inquiries. Admins may list all; regular users only their own (as owner) or those they sent (as inquirer).
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) return res.status(401).json({ error: 'Not authenticated' });

    const isAdmin = sessionUser.role === 'admin';
    const { listing_id } = req.query;

    let base = 'SELECT * FROM inquiries';
    const params = [];
    const clauses = [];
    let idx = 0;

    if (listing_id) { idx++; params.push(listing_id); clauses.push(`listing_id = $${idx}`); }

    if (!isAdmin) {
      // restrict to owner OR sender
      idx++; params.push(sessionUser.id); const ownerIdx = idx;
      idx++; params.push(sessionUser.id); const senderIdx = idx;
      clauses.push(`(owner_id = $${ownerIdx} OR sender_user_id = $${senderIdx})`);
    }

    if (clauses.length) base += ' WHERE ' + clauses.join(' AND ');
    base += ' ORDER BY created_at DESC';

    const { rows } = await db.query(base, params);
    res.json({ inquiries: rows });
  } catch (e) {
    console.error('Get inquiries error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET inquiries count (unread). Optional: owner_id or listing_id
app.get('/api/inquiries/count', async (req, res) => {
  try {
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) return res.status(401).json({ error: 'Not authenticated' });
    const isAdmin = sessionUser.role === 'admin';

    const { listing_id } = req.query;
    let base = 'SELECT COUNT(*)::int as cnt FROM inquiries WHERE is_read = FALSE';
    const params = [];
    let idx = 0;

    if (listing_id) { idx++; params.push(listing_id); base += ` AND listing_id = $${idx}`; }

    if (!isAdmin) {
      idx++; params.push(sessionUser.id); const ownerIdx = idx;
      idx++; params.push(sessionUser.id); const senderIdx = idx;
      base += ` AND (owner_id = $${ownerIdx} OR sender_user_id = $${senderIdx})`;
    }

    const { rows } = await db.query(base, params);
    res.json({ count: rows[0].cnt });
  } catch (e) {
    console.error('Count inquiries error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark inquiry as read
app.patch('/api/inquiries/:id/read', async (req, res) => {
  try {
    const id = req.params.id;
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) return res.status(401).json({ error: 'Not authenticated' });

    // Only listing owner or admin may mark an inquiry as read
    const { rows: inq } = await db.query('SELECT owner_id FROM inquiries WHERE id = $1 LIMIT 1', [id]);
    if (inq.length === 0) return res.status(404).json({ error: 'Inquiry not found' });
    const ownerId = inq[0].owner_id;
    if (sessionUser.role !== 'admin' && sessionUser.id !== ownerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.query('UPDATE inquiries SET is_read = TRUE WHERE id = $1', [id]);
    res.json({ message: 'Marked as read' });
  } catch (e) {
    console.error('Mark read error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Messages for an inquiry (chat-like)
app.get('/api/inquiries/:id/messages', async (req, res) => {
  try {
    const inquiryId = req.params.id;
    await db.query(`CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      inquiry_id INTEGER NOT NULL,
      sender_user_id INTEGER,
      sender_name TEXT,
      sender_email TEXT,
      body TEXT,
      attachment_stored TEXT,
      attachment_original TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    const sessionUser = req.session && req.session.user;
    if (!sessionUser) return res.status(401).json({ error: 'Not authenticated' });

    // verify that the session user is allowed to view messages for this inquiry
    const { rows: inq } = await db.query('SELECT owner_id, sender_user_id FROM inquiries WHERE id = $1 LIMIT 1', [inquiryId]);
    if (inq.length === 0) return res.status(404).json({ error: 'Inquiry not found' });
    const ownerId = inq[0].owner_id;
    const senderId = inq[0].sender_user_id;
    if (sessionUser.role !== 'admin' && sessionUser.id !== ownerId && sessionUser.id !== senderId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const { rows } = await db.query('SELECT * FROM messages WHERE inquiry_id = $1 AND deleted = FALSE ORDER BY created_at ASC', [inquiryId]);
    res.json({ messages: rows });
  } catch (e) {
    console.error('Get messages error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/inquiries/:id/messages', async (req, res) => {
  try {
    const inquiryId = req.params.id;
    const { sender_user_id, sender_name, sender_email, body } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ error: 'Message body required' });

    await db.query(`CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      inquiry_id INTEGER NOT NULL,
      sender_user_id INTEGER,
      sender_name TEXT,
      sender_email TEXT,
      body TEXT,
      attachment_stored TEXT,
      attachment_original TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // ensure sender is authorized (either the inquiry sender, the listing owner, or admin)
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) return res.status(401).json({ error: 'Not authenticated' });
    const { rows: inq } = await db.query('SELECT owner_id, sender_user_id FROM inquiries WHERE id = $1 LIMIT 1', [inquiryId]);
    if (inq.length === 0) return res.status(404).json({ error: 'Inquiry not found' });
    const ownerId = inq[0].owner_id;
    const senderId = inq[0].sender_user_id;
    if (sessionUser.role !== 'admin' && sessionUser.id !== ownerId && sessionUser.id !== senderId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const insert = await db.query(
      `INSERT INTO messages (inquiry_id, sender_user_id, sender_name, sender_email, body) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [inquiryId, sender_user_id || sessionUser.id || null, sender_name || sessionUser.username || null, sender_email || null, body]
    );

    // mark inquiry as unread for recipient (owner) when a new message arrives
    try {
      await db.query('UPDATE inquiries SET is_read = FALSE WHERE id = $1', [inquiryId]);
    } catch (e) { console.warn('Could not mark inquiry unread', e); }
    // emit via socket.io if available
    try {
      if (io) io.to('inquiry_' + inquiryId).emit('inquiry_message', insert.rows[0]);
    } catch (e) { console.warn('Socket emit failed', e); }

    res.status(201).json({ message: 'Sent', msg: insert.rows[0] });
  } catch (e) {
    console.error('Post message error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload message with attachment (multipart/form-data)
const uploadMsg = multer({ storage });
app.post('/api/inquiries/:id/messages/upload', uploadMsg.single('attachment'), async (req, res) => {
  try {
    const inquiryId = req.params.id;
    const { sender_user_id, sender_name, sender_email, body } = req.body;
    if (!body || !body.trim()) return res.status(400).json({ error: 'Message body required' });

    await db.query(`CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      inquiry_id INTEGER NOT NULL,
      sender_user_id INTEGER,
      sender_name TEXT,
      sender_email TEXT,
      body TEXT,
      attachment_stored TEXT,
      attachment_original TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      deleted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // ensure sender is authorized (either the inquiry sender, the listing owner, or admin)
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) return res.status(401).json({ error: 'Not authenticated' });
    const { rows: inq } = await db.query('SELECT owner_id, sender_user_id FROM inquiries WHERE id = $1 LIMIT 1', [inquiryId]);
    if (inq.length === 0) return res.status(404).json({ error: 'Inquiry not found' });
    const ownerId = inq[0].owner_id;
    const senderId = inq[0].sender_user_id;
    if (sessionUser.role !== 'admin' && sessionUser.id !== ownerId && sessionUser.id !== senderId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    let stored = null, original = null;
    if (req.file) {
      stored = req.file.filename;
      original = req.file.originalname || req.file.filename;
    }

    const insert = await db.query(
      `INSERT INTO messages (inquiry_id, sender_user_id, sender_name, sender_email, body, attachment_stored, attachment_original)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [inquiryId, sender_user_id || sessionUser.id || null, sender_name || sessionUser.username || null, sender_email || null, body, stored, original]
    );

    try { await db.query('UPDATE inquiries SET is_read = FALSE WHERE id = $1', [inquiryId]); } catch (e) { console.warn(e); }
    try { if (io) io.to('inquiry_' + inquiryId).emit('inquiry_message', insert.rows[0]); } catch (e) { console.warn(e); }
    res.status(201).json({ message: 'Sent', msg: insert.rows[0] });
  } catch (e) { console.error('Post message upload error', e); res.status(500).json({ error: 'Server error' }); }
});

// Soft-delete a message
app.patch('/api/messages/:id/delete', async (req, res) => {
  try {
    const id = req.params.id;
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) return res.status(401).json({ error: 'Not authenticated' });

    // fetch message and its inquiry owner
    const { rows: msgs } = await db.query('SELECT inquiry_id, sender_user_id FROM messages WHERE id = $1 LIMIT 1', [id]);
    if (msgs.length === 0) return res.status(404).json({ error: 'Message not found' });
    const msg = msgs[0];
    const { rows: inq } = await db.query('SELECT owner_id FROM inquiries WHERE id = $1 LIMIT 1', [msg.inquiry_id]);
    const ownerId = inq.length ? inq[0].owner_id : null;

    // Allow admin, message sender, or inquiry owner to delete
    if (sessionUser.role !== 'admin' && sessionUser.id !== msg.sender_user_id && sessionUser.id !== ownerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.query('UPDATE messages SET deleted = TRUE WHERE id = $1', [id]);
    res.json({ message: 'Message deleted' });
  } catch (e) {
    console.error('Delete message error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark a message as read
app.patch('/api/messages/:id/read', async (req, res) => {
  try {
    const id = req.params.id;
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) return res.status(401).json({ error: 'Not authenticated' });

    const { rows: msgs } = await db.query('SELECT inquiry_id, sender_user_id FROM messages WHERE id = $1 LIMIT 1', [id]);
    if (msgs.length === 0) return res.status(404).json({ error: 'Message not found' });
    const msg = msgs[0];
    const { rows: inq } = await db.query('SELECT owner_id FROM inquiries WHERE id = $1 LIMIT 1', [msg.inquiry_id]);
    const ownerId = inq.length ? inq[0].owner_id : null;

    // Allow admin or inquiry owner to mark messages as read
    if (sessionUser.role !== 'admin' && sessionUser.id !== ownerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.query('UPDATE messages SET is_read = TRUE WHERE id = $1', [id]);
    res.json({ message: 'Message marked as read' });
  } catch (e) {
    console.error('Mark message read error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------
// Listing Status Notifications
// -------------------
// Get all listing status notifications for current user
app.get('/api/listing-notifications', async (req, res) => {
  try {
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Ensure table exists
    await db.query(`CREATE TABLE IF NOT EXISTS listing_notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      listing_title TEXT,
      status TEXT,
      reason TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    const { rows } = await db.query(
      `SELECT * FROM listing_notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [sessionUser.id]
    );

    res.json(rows);
  } catch (e) {
    console.error('Get listing notifications error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get unread listing notification count
app.get('/api/listing-notifications/count', async (req, res) => {
  try {
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Ensure table exists
    await db.query(`CREATE TABLE IF NOT EXISTS listing_notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      listing_title TEXT,
      status TEXT,
      reason TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    const { rows } = await db.query(
      `SELECT COUNT(*)::int as count FROM listing_notifications 
       WHERE user_id = $1 AND is_read = FALSE`,
      [sessionUser.id]
    );

    res.json({ count: rows[0].count });
  } catch (e) {
    console.error('Count listing notifications error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark listing notification as read
app.patch('/api/listing-notifications/:id/read', async (req, res) => {
  try {
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const notifId = req.params.id;

    // Verify ownership
    const { rows: notifs } = await db.query(
      'SELECT user_id FROM listing_notifications WHERE id = $1',
      [notifId]
    );

    if (notifs.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notifs[0].user_id !== sessionUser.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.query('UPDATE listing_notifications SET is_read = TRUE WHERE id = $1', [notifId]);
    res.json({ message: 'Marked as read' });
  } catch (e) {
    console.error('Mark notification read error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete listing notification
app.delete('/api/listing-notifications/:id', async (req, res) => {
  try {
    const sessionUser = req.session && req.session.user;
    if (!sessionUser) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const notifId = req.params.id;

    // Verify ownership
    const { rows: notifs } = await db.query(
      'SELECT user_id FROM listing_notifications WHERE id = $1',
      [notifId]
    );

    if (notifs.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notifs[0].user_id !== sessionUser.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await db.query('DELETE FROM listing_notifications WHERE id = $1', [notifId]);
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('Delete notification error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET / POST notification preferences for a user
app.get('/api/user/:user_id/notification-prefs', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    await db.query(`CREATE TABLE IF NOT EXISTS notification_preferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER UNIQUE NOT NULL,
      email_new_inquiry BOOLEAN DEFAULT TRUE,
      email_digest BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);
    const { rows } = await db.query('SELECT * FROM notification_preferences WHERE user_id = $1', [user_id]);
    if (rows.length === 0) {
      // return defaults
      return res.json({ email_new_inquiry: true, email_digest: true });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error('Get prefs error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/user/:user_id/notification-prefs', async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const { email_new_inquiry, email_digest } = req.body;
    await db.query(`INSERT INTO notification_preferences (user_id, email_new_inquiry, email_digest)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE SET email_new_inquiry = $2, email_digest = $3`,
      [user_id, email_new_inquiry !== false, email_digest !== false]
    );
    res.json({ message: 'Preferences updated' });
  } catch (e) {
    console.error('Update prefs error', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Email notification helper (async, non-blocking)
function sendInquiryNotificationEmail(inquiry, listing, owner_id) {
  setImmediate(async () => {
    try {  
      // Get owner's email from users table
      const { rows: users } = await db.query('SELECT email FROM users WHERE id = $1', [owner_id]);
      if (!users.length) return console.log('Owner email not found');
      const ownerEmail = users[0].email;

      // Ensure email_logs table exists
      await db.query(`CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        inquiry_id INTEGER,
        email_address TEXT,
        subject TEXT,
        status TEXT DEFAULT 'pending',
        error_text TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )`);

      const subject = `New Inquiry: ${listing.title}`;
      const fromAddress = process.env.FROM_EMAIL || 'no-reply@laboconnect.local';
      const text = `You have a new inquiry for your listing:\n\nTitle: ${listing.title}\nFrom: ${inquiry.first_name} ${inquiry.last_name} <${inquiry.email}>\nContact: ${inquiry.contact_number}\nCompany: ${inquiry.company || ''}\n\nMessage:\n${inquiry.message || ''}`;
      const html = `<p>You have a new inquiry for your listing:</p>
        <p><strong>Title:</strong> ${listing.title}</p>
        <p><strong>From:</strong> ${inquiry.first_name} ${inquiry.last_name} &lt;${inquiry.email}&gt;</p>
        <p><strong>Contact:</strong> ${inquiry.contact_number}</p>
        <p><strong>Company:</strong> ${inquiry.company || ''}</p>
        <hr>
        <p>${inquiry.message || ''}</p>`;

      // Insert a pending log entry
      const insertResult = await db.query(
        'INSERT INTO email_logs (user_id, inquiry_id, email_address, subject, status) VALUES ($1,$2,$3,$4,$5) RETURNING id',
        [owner_id, inquiry.id, ownerEmail, subject, 'pending']
      );
      const logId = insertResult.rows[0].id;

      // Try SendGrid first
      if (process.env.SENDGRID_API_KEY) {
        try {
          const sgMail = require('@sendgrid/mail');
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          await sgMail.send({
            to: ownerEmail,
            from: fromAddress,
            subject,
            text,
            html
          });
          await db.query('UPDATE email_logs SET status = $1, sent_at = NOW() WHERE id = $2', ['sent', logId]);
          return;
        } catch (e) {
          console.warn('SendGrid send failed:', e.message || e);
          await db.query('UPDATE email_logs SET status = $1, error_text = $2 WHERE id = $3', ['failed', String(e), logId]);
        }
      }

      // Fallback to SMTP via Nodemailer
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: (process.env.SMTP_SECURE === 'true'),
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });

          await transporter.sendMail({
            from: fromAddress,
            to: ownerEmail,
            subject,
            text,
            html
          });
          await db.query('UPDATE email_logs SET status = $1, sent_at = NOW() WHERE id = $2', ['sent', logId]);
          return;
        } catch (e) {
          console.warn('SMTP send failed:', e.message || e);
          await db.query('UPDATE email_logs SET status = $1, error_text = $2 WHERE id = $3', ['failed', String(e), logId]);
        }
      }

      // If no provider configured, just mark as logged and leave
      await db.query('UPDATE email_logs SET status = $1 WHERE id = $2', ['logged', logId]);
      console.log('No email provider configured; logged email in email_logs');
    } catch (e) {
      console.error('Email notification error:', e);
    }
  });
}

// Rejection notification helper (async, non-blocking)
function sendRejectionNotificationEmail(ownerEmail, listingTitle, rejectionReason) {
  setImmediate(async () => {
    try {
      // Ensure email_logs table exists
      await db.query(`CREATE TABLE IF NOT EXISTS email_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        inquiry_id INTEGER,
        email_address TEXT,
        subject TEXT,
        status TEXT DEFAULT 'pending',
        error_text TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )`);

      const subject = `Your Listing was Rejected: ${listingTitle}`;
      const fromAddress = process.env.FROM_EMAIL || 'no-reply@laboconnect.local';
      const reasonText = rejectionReason || 'No specific reason provided';
      const text = `Unfortunately, your listing "${listingTitle}" has been rejected.\n\nReason: ${reasonText}\n\nPlease review your listing and submit again with the necessary corrections.`;
      const html = `<p>Unfortunately, your listing <strong>"${listingTitle}"</strong> has been rejected.</p>
        <p><strong>Reason:</strong> ${reasonText}</p>
        <p>Please review your listing and submit again with the necessary corrections.</p>`;

      // Insert a pending log entry
      const insertResult = await db.query(
        'INSERT INTO email_logs (email_address, subject, status) VALUES ($1,$2,$3) RETURNING id',
        [ownerEmail, subject, 'pending']
      );
      const logId = insertResult.rows[0].id;

      // Try SendGrid first
      if (process.env.SENDGRID_API_KEY) {
        try {
          const sgMail = require('@sendgrid/mail');
          sgMail.setApiKey(process.env.SENDGRID_API_KEY);
          await sgMail.send({
            to: ownerEmail,
            from: fromAddress,
            subject,
            text,
            html
          });
          await db.query('UPDATE email_logs SET status = $1, sent_at = NOW() WHERE id = $2', ['sent', logId]);
          return;
        } catch (e) {
          console.warn('SendGrid send failed:', e.message || e);
          await db.query('UPDATE email_logs SET status = $1, error_text = $2 WHERE id = $3', ['failed', String(e), logId]);
        }
      }

      // Fallback to SMTP via Nodemailer
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: (process.env.SMTP_SECURE === 'true'),
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });

          await transporter.sendMail({
            from: fromAddress,
            to: ownerEmail,
            subject,
            text,
            html
          });
          await db.query('UPDATE email_logs SET status = $1, sent_at = NOW() WHERE id = $2', ['sent', logId]);
          return;
        } catch (e) {
          console.warn('SMTP send failed:', e.message || e);
          await db.query('UPDATE email_logs SET status = $1, error_text = $2 WHERE id = $3', ['failed', String(e), logId]);
        }
      }

      // If no provider configured, just mark as logged and leave
      await db.query('UPDATE email_logs SET status = $1 WHERE id = $2', ['logged', logId]);
      console.log('No email provider configured; logged rejection email in email_logs');
    } catch (e) {
      console.error('Rejection email notification error:', e);
    }
  });
}

app.get("/listings", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT * FROM listings WHERE approved = true ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Helper function to create a notification for listing status change
async function createListingStatusNotification(userId, listingId, listingTitle, status, reason = null) {
  try {
    // Ensure notifications table exists
    await db.query(`CREATE TABLE IF NOT EXISTS listing_notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      listing_id INTEGER NOT NULL,
      listing_title TEXT,
      status TEXT,
      reason TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )`);

    // Insert notification
    await db.query(
      `INSERT INTO listing_notifications (user_id, listing_id, listing_title, status, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, listingId, listingTitle, status, reason || null]
    );
  } catch (e) {
    console.warn('Could not create listing notification:', e.message);
  }
}

// -------------------
// Admin Routes
// -------------------
app.post("/admin/approve-listing/:id", async (req, res) => {
  const listingId = req.params.id;
  try {
    // Get listing details before updating
    const { rows: listings } = await db.query(
      'SELECT id, owner_id, title FROM listings WHERE id = $1 LIMIT 1',
      [listingId]
    );
    if (listings.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    const listing = listings[0];

    await db.query(
      `UPDATE listings
       SET approved = true, status = 'approved', updated_at = NOW()
       WHERE id = $1`,
      [listingId]
    );

    // Create notification for listing owner
    if (listing.owner_id) {
      await createListingStatusNotification(listing.owner_id, listingId, listing.title, 'approved');
    }

    res.json({ message: "Listing approved!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/admin/listings/:id/reject", async (req, res) => {
  const listingId = req.params.id;
  const { reason } = req.body;
  const sessionUser = req.session && req.session.user;
  if (!sessionUser || sessionUser.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    // Ensure rejection_reason column exists
    try {
      await db.query(`ALTER TABLE listings ADD COLUMN IF NOT EXISTS rejection_reason TEXT`);
    } catch (e) {
      console.warn('Could not add rejection_reason column:', e.message);
    }

    // Get listing details before updating
    const { rows: listings } = await db.query(
      'SELECT id, owner_id, title FROM listings WHERE id = $1 LIMIT 1',
      [listingId]
    );
    if (listings.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    const listing = listings[0];

    // Update listing with rejection reason
    await db.query(
      `UPDATE listings
       SET status = 'rejected', rejection_reason = $1, updated_at = NOW()
       WHERE id = $2`,
      [reason || null, listingId]
    );

    // Create notification for listing owner
    if (listing.owner_id) {
      await createListingStatusNotification(listing.owner_id, listingId, listing.title, 'rejected', reason);
    }

    // Send rejection notification email to listing owner if they exist
    if (listing.owner_id) {
      try {
        const { rows: users } = await db.query('SELECT email FROM users WHERE id = $1', [listing.owner_id]);
        if (users.length > 0) {
          sendRejectionNotificationEmail(users[0].email, listing.title, reason);
        }
      } catch (e) {
        console.warn('Could not send rejection notification:', e.message);
      }
    }

    res.json({ message: "Listing rejected", rejection_reason: reason });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/admin/listings", async (req, res) => {
  // Supports optional ?status=pending|approved|rejected to filter results
  try {
    const status = req.query.status;
        let q = `SELECT listings.id, listings.owner_id, users.email AS owner_email, listings.owner_name, listings.title, listings.type, listings.status, listings.price, listings.size_sqm AS size,
        listings.description, listings.image_url, listings.oct_tct_url, listings.tax_declaration_url, listings.doas_url, listings.government_id_url,
        listings.views, listings.inquiries, listings.created_at
      FROM listings
      LEFT JOIN users ON listings.owner_id = users.id`;
    const params = [];
    if (status) {
      params.push(status);
      q += ` WHERE status = $1`;
    }
    q += ` ORDER BY created_at DESC`;

    const { rows } = await db.query(q, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load listings" });
  }
});

// Fallback route for /admin/listings/:status (kept for compatibility with older frontends)
app.get('/admin/listings/:status', async (req, res) => {
  const status = req.params.status;
  try {
        const q = `SELECT listings.id, listings.owner_id, users.email AS owner_email, listings.owner_name, listings.title, listings.type, listings.status, listings.price, listings.size_sqm AS size,
        listings.description, listings.image_url, listings.oct_tct_url, listings.tax_declaration_url, listings.doas_url, listings.government_id_url,
        listings.views, listings.inquiries, listings.created_at
      FROM listings
      LEFT JOIN users ON listings.owner_id = users.id
      WHERE listings.status = $1 ORDER BY listings.created_at DESC`;
    const { rows } = await db.query(q, [status]);
    res.json(rows);
  } catch (err) {
    console.error('Get listings by status error', err);
    res.status(500).json({ error: 'Failed to load listings' });
  }
});

// DELETE a listing (admin only). Cleans up uploads, uploads_meta, user_listings, inquiries, messages.
app.delete('/admin/listings/:id', async (req, res) => {
  const listingId = req.params.id;
  const sessionUser = req.session && req.session.user;
  if (!sessionUser || sessionUser.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // fetch listing and file fields
    const { rows: listings } = await client.query('SELECT id, image_url, oct_tct_url, tax_declaration_url, doas_url, government_id_url FROM listings WHERE id = $1 LIMIT 1', [listingId]);
    if (listings.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Listing not found' });
    }
    const listing = listings[0];

    // delete uploads_meta rows and collect filenames to remove
    let metas = [];
    try {
      const result = await client.query('SELECT stored_filename FROM uploads_meta WHERE listing_id = $1', [listingId]);
      metas = result.rows || [];
    } catch (e) {
      console.warn('Could not fetch uploads_meta:', e.message);
    }
    const filesToDelete = metas.map(m => m.stored_filename).filter(Boolean);

    // also include direct urls found on listing row
    ['image_url','oct_tct_url','tax_declaration_url','doas_url','government_id_url'].forEach(f => {
      const url = listing[f];
      if (url && typeof url === 'string' && url.startsWith('/uploads/')) {
        const fn = path.basename(url);
        if (!filesToDelete.includes(fn)) filesToDelete.push(fn);
      }
    });

    // delete related rows in correct order (respecting foreign key constraints)
    try { 
      // Delete email logs first (depends on inquiries)
      await client.query('DELETE FROM email_logs WHERE inquiry_id IN (SELECT id FROM inquiries WHERE listing_id = $1)', [listingId]); 
    } catch(e) { 
      console.warn('Could not delete email_logs:', e.message); 
    }
    try { 
      // Then delete messages
      await client.query('DELETE FROM messages WHERE inquiry_id IN (SELECT id FROM inquiries WHERE listing_id = $1)', [listingId]); 
    } catch(e) { 
      console.warn('Could not delete messages:', e.message); 
    }
    try { 
      // Then delete inquiries
      await client.query('DELETE FROM inquiries WHERE listing_id = $1', [listingId]); z
    } catch(e) { 
      console.warn('Could not delete inquiries:', e.message); 
    }
    try { 
      await client.query('DELETE FROM uploads_meta WHERE listing_id = $1', [listingId]); 
    } catch(e) { 
      console.warn('Could not delete uploads_meta:', e.message); 
    }
    try { 
      await client.query('DELETE FROM user_listings WHERE listing_id = $1', [listingId]); 
    } catch(e) { 
      console.warn('Could not delete user_listings:', e.message); 
    }

    // delete the listing (this one should succeed)
    try {
      await client.query('DELETE FROM listings WHERE id = $1', [listingId]);
    } catch(e) {
      console.error('Critical error deleting listing:', e.message);
      throw e;
    }

    await client.query('COMMIT');

    // remove files from disk (best-effort, non-blocking)
    filesToDelete.forEach(fn => {
      try {
        const p = path.join(uploadDir, fn);
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch (e) { console.warn('Failed to delete upload file', fn, e); }
    });

    res.json({ message: 'Listing deleted' });
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (e) { /* ignore */ }
    console.error('Delete listing error', err);
    res.status(500).json({ error: 'Failed to delete listing' });
  } finally {
    client.release();
  }
});

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

// Approved listings for frontend
app.get("/api/approved-listings", async (req, res) => {
  try {
    // detect if latitude/longitude columns exist
    const { rows: cols } = await db.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = $1 AND column_name = ANY($2)`,
      ['listings', ['latitude', 'longitude']]
    );
    const existing = cols.map(r => r.column_name);

    const selectFields = ['l.id', 'l.title', 'l.description', 'l.type', 'l.price', 'l.size_sqm AS size', 'l.image_url', 'l.owner_id', 'u.username AS owner_name'];
    if (existing.includes('latitude')) selectFields.push('l.latitude');
    if (existing.includes('longitude')) selectFields.push('l.longitude');

    const q = `SELECT ${selectFields.join(', ')} FROM listings l LEFT JOIN users u ON l.owner_id = u.id WHERE l.status = 'approved' ORDER BY l.created_at DESC`;
    const { rows } = await db.query(q);
    res.json(rows);
  } catch (err) {
    console.error('Approved listings error:', err);
    res.status(500).json({ error: "Database error" });
  }
});

// Single listing by id (approved or not) - return full row
app.get('/api/listing/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const q = `SELECT listings.*, users.email AS owner_email, users.username AS owner_username
               FROM listings
               LEFT JOIN users ON listings.owner_id = users.id
               WHERE listings.id = $1 LIMIT 1`;
    const { rows } = await db.query(q, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Listing not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Fetch listing error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Secure download route that sets Content-Disposition so files download with correct filename
app.get('/download/:file', (req, res) => {
  (async () => {
    try {
      const file = path.basename(req.params.file);
      const filePath = path.join(__dirname, 'public', 'uploads', file);
      if (!fs.existsSync(filePath)) return res.status(404).send('File not found');

      // try to find original filename in uploads_meta
      let originalName = null;
      try {
        const q = await db.query('SELECT original_filename FROM uploads_meta WHERE stored_filename = $1 LIMIT 1', [file]);
        if (q.rows && q.rows[0] && q.rows[0].original_filename) originalName = q.rows[0].original_filename;
      } catch (e) {
        console.warn('uploads_meta lookup failed', e.message || e);
      }

      if (originalName) return res.download(filePath, originalName);
      return res.download(filePath);
    } catch (err) {
      console.error('Download error', err);
      res.status(500).send('Server error');
    }
  })();
});

// Get location data for map (latitude, longitude, business name)
app.get("/api/locations", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, title, latitude, longitude, type, price 
       FROM locations 
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch locations" });
  }
});

// Get a specific location by ID for iframe embed
app.get("/api/location/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      `SELECT id, title, latitude, longitude, type, price, description
       FROM locations 
       WHERE id = $1`,
      [id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }
    
    const location = rows[0];
    res.json(location);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch location" });
  }
});

// Add new location with duplicate detection
app.post("/api/locations", async (req, res) => {
  try {
    const { title, description, type, latitude, longitude, price } = req.body;

    // Validate required fields
    if (!title || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Title, latitude, and longitude are required" });
    }

    // Parse values
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const priceVal = price ? parseFloat(price) : 0;

    // Validate coordinates
    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: "Invalid latitude or longitude" });
    }

    // Check for duplicates (same title OR same coordinates within 0.0001 precision)
    const { rows: duplicates } = await db.query(
      `SELECT id FROM locations 
       WHERE LOWER(title) = LOWER($1) 
       OR (ABS(latitude - $2) < 0.0001 AND ABS(longitude - $3) < 0.0001)`,
      [title, lat, lng]
    );

    if (duplicates.length > 0) {
      return res.status(409).json({ error: "Location already exists (duplicate title or coordinates)" });
    }

    // Insert new location
    const { rows } = await db.query(
      `INSERT INTO locations (title, description, type, latitude, longitude, price, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [title, description || null, type || null, lat, lng, priceVal]
    );

    res.status(201).json({ 
      message: "Location added successfully!", 
      location: rows[0] 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add location" });
  }
});

// Delete a location (admin only)
app.delete("/api/locations/:id", async (req, res) => {
  try {
    const sessionUser = req.session && req.session.user;
    
    // Check if user is admin
    if (!sessionUser || sessionUser.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - Admin access required' });
    }

    const { id } = req.params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({ error: "Invalid location ID" });
    }

    // Delete the location
    const { rows } = await db.query(
      `DELETE FROM locations WHERE id = $1 RETURNING id`,
      [parseInt(id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json({ message: "Location deleted successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete location" });
  }
});

// Admin helper: repair uploaded files that were saved without extensions
// This will scan listings document URL fields under /uploads and try to detect file type
// by reading file signature, rename the file to include an extension, and update DB.
app.post('/admin/repair-uploads', async (req, res) => {
  try {
    // fetch all listings and their upload fields
    const { rows: listings } = await db.query(
      `SELECT id, image_url, oct_tct_url, tax_declaration_url, doas_url, government_id_url
       FROM listings`
    );

    const fixes = [];

    for (const row of listings) {
      const fields = ['image_url','oct_tct_url','tax_declaration_url','doas_url','government_id_url'];
      for (const field of fields) {
        const url = row[field];
        if (!url || typeof url !== 'string') continue;
        if (!url.startsWith('/uploads/')) continue;

        const filename = path.basename(url);
        // skip if filename already has an extension
        if (path.extname(filename)) continue;

        const filePath = path.join(uploadDir, filename);
        if (!fs.existsSync(filePath)) continue;

        // read first bytes to detect type
        const fd = fs.openSync(filePath, 'r');
        const buf = Buffer.alloc(8);
        fs.readSync(fd, buf, 0, 8, 0);
        fs.closeSync(fd);

        let ext = '';
        const sig = buf.toString('hex');
        // JPEG: ff d8 ff
        if (buf[0] === 0xFF && buf[1] === 0xD8) ext = '.jpg';
        // PNG: 89 50 4e 47
        else if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) ext = '.png';
        // PDF: %PDF
        else if (buf.slice(0,4).toString() === '%PDF') ext = '.pdf';
        // PK (zip/docx): 50 4b 03 04
        else if (buf[0] === 0x50 && buf[1] === 0x4B) ext = '.docx';
        else ext = ''; // unknown

        if (ext) {
          const newName = filename + ext;
          const newPath = path.join(uploadDir, newName);
          fs.renameSync(filePath, newPath);
          const newUrl = '/uploads/' + newName;

          // update DB
          await db.query(`UPDATE listings SET ${field} = $1 WHERE id = $2`, [newUrl, row.id]);
          fixes.push({ id: row.id, field, old: url, new: newUrl });
        }
      }
    }

    res.json({ message: 'Repair finished', fixes });
  } catch (err) {
    console.error('Repair error:', err);
    res.status(500).json({ error: 'Repair failed', detail: String(err) });
  }
});

// -------------------
// Economic Data API (Admin Only)
// -------------------

// Helper to check if user is admin
function isAdmin(req) {
  return req.session && req.session.user && req.session.user.role === 'admin';
}

// GET economic data
app.get('/api/economic-data', async (req, res) => {
  try {
    // Ensure table exists
    await db.query(`CREATE TABLE IF NOT EXISTS economic_data (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      label TEXT,
      icon TEXT,
      updated_at TIMESTAMP DEFAULT NOW(),
      updated_by INTEGER
    )`);

    const { rows } = await db.query('SELECT * FROM economic_data ORDER BY id');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching economic data:', err);
    res.status(500).json({ error: 'Failed to fetch economic data' });
  }
});

// UPDATE economic data (admin only)
app.put('/api/economic-data/:key', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { key } = req.params;
  const { value, label, icon } = req.body;

  try {
    // Ensure table exists
    await db.query(`CREATE TABLE IF NOT EXISTS economic_data (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      label TEXT,
      icon TEXT,
      updated_at TIMESTAMP DEFAULT NOW(),
      updated_by INTEGER
    )`);

    const userId = req.session.user.id;
    const { rows } = await db.query(
      `INSERT INTO economic_data (key, value, label, icon, updated_at, updated_by) 
       VALUES ($1, $2, $3, $4, NOW(), $5)
       ON CONFLICT (key) DO UPDATE SET 
         value = $2, 
         label = $3, 
         icon = $4,
         updated_at = NOW(),
         updated_by = $5
       RETURNING *`,
      [key, value, label, icon, userId]
    );

    res.json({ message: 'Economic data updated', data: rows[0] });
  } catch (err) {
    console.error('Error updating economic data:', err);
    res.status(500).json({ error: 'Failed to update economic data' });
  }
});

// Initialize default economic data
app.post('/api/economic-data/init/defaults', async (req, res) => {
  if (!isAdmin(req)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    // Ensure table exists
    await db.query(`CREATE TABLE IF NOT EXISTS economic_data (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      label TEXT,
      icon TEXT,
      updated_at TIMESTAMP DEFAULT NOW(),
      updated_by INTEGER
    )`);

    const defaults = [
      { key: 'population', value: '108,319', label: 'Population', icon: '👥' },
      { key: 'population_change', value: '-0.20 from 2020', label: 'Population Change', icon: '' },
      { key: 'land_area', value: '648.8 km²', label: 'Aggregated Land Area', icon: '📍' },
      { key: 'land_breakdown', value: '65% Agricultural, 25% Residential, 10% Commercial', label: 'Land Breakdown', icon: '' },
      { key: 'businesses', value: '905', label: 'Registered Businesses', icon: '🏢' },
      { key: 'business_change', value: '0.78% increase', label: 'Business Growth', icon: '' },
      { key: 'gross_income', value: '₱2,175,205,198.94', label: 'Gross Income', icon: '💰' },
      { key: 'income_note', value: 'New and renewal', label: 'Income Note', icon: '' }
    ];

    const userId = req.session.user.id;
    
    for (const item of defaults) {
      await db.query(
        `INSERT INTO economic_data (key, value, label, icon, updated_by) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (key) DO NOTHING`,
        [item.key, item.value, item.label, item.icon, userId]
      );
    }

    res.json({ message: 'Default economic data initialized' });
  } catch (err) {
    console.error('Error initializing economic data:', err);
    res.status(500).json({ error: 'Failed to initialize economic data' });
  }
});

// -------------------
// Start server
// -------------------
// Start HTTP server and attach socket.io
const server = http.createServer(app);
try {
  io = new IOServer(server, { /* options if needed */ });

  io.on('connection', (socket) => {
    // clients should emit 'join' with room name like 'inquiry_<id>'
    socket.on('join', (room) => {
      try {
        socket.join(room);
        // emit presence to room
        try {
          const s = io.sockets.adapter.rooms.get(room);
          const count = s ? s.size : 0;
          io.to(room).emit('inquiry_presence', { room, count });
        } catch (e) { console.warn('Presence emit failed', e); }
      } catch (e) { console.warn('Socket join failed', e); }
    });
    socket.on('leave', (room) => {
      try {
        socket.leave(room);
        const s = io.sockets.adapter.rooms.get(room);
        const count = s ? s.size : 0;
        io.to(room).emit('inquiry_presence', { room, count });
      } catch (e) { console.warn('Socket leave failed', e); }
    });

    socket.on('disconnecting', () => {
      try {
        const rooms = Array.from(socket.rooms || []).filter(r => r !== socket.id);
        rooms.forEach(room => {
          const s = io.sockets.adapter.rooms.get(room);
          const count = s ? (s.size - 1) : 0; // one will leave
          io.to(room).emit('inquiry_presence', { room, count });
        });
      } catch (e) { console.warn('Disconnect presence handling failed', e); }
    });
  });
} catch (e) {
  console.warn('Socket.io init failed', e);
}

if (require.main === module) {
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Server running at http://localhost:${port}`));
}

module.exports = app;
