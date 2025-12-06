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
const session = require('express-session');

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
  secret: process.env.SESSION_SECRET || 'labo-connect-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

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
// User Registration
// -------------------
app.post("/register", async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Please fill all required fields" });
  }

  try {
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

    res.status(201).json({ message: "User registered successfully!", user: rows[0] });

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
    req.session.user = { id: user.id, username: user.username, role: user.role };

    // Return user info including role
    res.json({
      message: "Login successful!",
      user: { id: user.id, username: user.username, role: user.role }
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
  const { 
    owner_first_name, 
    owner_last_name, 
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
  if (!owner_first_name || !owner_last_name || !title || !description || !type || !price) {
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
      'owner_first_name','owner_last_name','title','description','type','price','size_sqm'
    ];
    const values = [owner_first_name, owner_last_name, title, description, type, price, size_sqm || null];
    
    // Add owner_id if provided (from logged-in user)
    if (user_id) {
      insertCols.push('owner_id');
      values.push(parseInt(user_id));
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
  const { listing_id, first_name, last_name, contact_number, email, company, message, sender_user_id } = req.body;
  if (!listing_id || !first_name || !last_name || !contact_number || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // ensure inquiries table exists
    await db.query(`CREATE TABLE IF NOT EXISTS inquiries (
      id SERIAL PRIMARY KEY,
      listing_id INTEGER,
      sender_user_id INTEGER,
      first_name TEXT,
      last_name TEXT,
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
    const ownerName = ((listing.owner_first_name || '') + ' ' + (listing.owner_last_name || '')).trim().toLowerCase();
    const senderName = ((first_name || '') + ' ' + (last_name || '')).trim().toLowerCase();
    if (ownerName && senderName && ownerName === senderName) {
      return res.status(400).json({ error: "Owner cannot send inquiry to their own listing" });
    }

    const insert = await db.query(
      `INSERT INTO inquiries (listing_id, sender_user_id, first_name, last_name, contact_number, email, company, message, owner_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [listing_id, sender_user_id || null, first_name, last_name, contact_number, email, company || null, message || null, listing.owner_id || null]
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
    const { listing_id, owner_id, listing_owner } = req.query;
    let base = 'SELECT * FROM inquiries';
    const params = [];
    const clauses = [];
    if (listing_id) { params.push(listing_id); clauses.push(`listing_id = $${params.length}`); }
    if (owner_id) { params.push(owner_id); clauses.push(`owner_id = $${params.length}`); }
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
    const { owner_id, listing_id } = req.query;
    let base = 'SELECT COUNT(*)::int as cnt FROM inquiries WHERE is_read = FALSE';
    const params = [];
    if (owner_id) { params.push(owner_id); base += ` AND owner_id = $${params.length}`; }
    if (listing_id) { params.push(listing_id); base += ` AND listing_id = $${params.length}`; }
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

    const insert = await db.query(
      `INSERT INTO messages (inquiry_id, sender_user_id, sender_name, sender_email, body) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [inquiryId, sender_user_id || null, sender_name || null, sender_email || null, body]
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

    let stored = null, original = null;
    if (req.file) {
      stored = req.file.filename;
      original = req.file.originalname || req.file.filename;
    }

    const insert = await db.query(
      `INSERT INTO messages (inquiry_id, sender_user_id, sender_name, sender_email, body, attachment_stored, attachment_original)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [inquiryId, sender_user_id || null, sender_name || null, sender_email || null, body, stored, original]
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
    await db.query('UPDATE messages SET is_read = TRUE WHERE id = $1', [id]);
    res.json({ message: 'Message marked as read' });
  } catch (e) {
    console.error('Mark message read error', e);
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

// -------------------
// Admin Routes
// -------------------
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
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/admin/listings", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, owner_first_name, owner_last_name, title, type, status, price, size_sqm AS size,
              description, image_url, oct_tct_url, tax_declaration_url, doas_url, government_id_url,
              views, inquiries, created_at
       FROM listings
       ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load listings" });
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

    const selectFields = ['id', 'title', 'description', 'type', 'price', 'size_sqm AS size', 'image_url'];
    if (existing.includes('latitude')) selectFields.push('latitude');
    if (existing.includes('longitude')) selectFields.push('longitude');

    const q = `SELECT ${selectFields.join(', ')} FROM listings WHERE status = 'approved'`;
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
    const { rows } = await db.query('SELECT * FROM listings WHERE id = $1 LIMIT 1', [id]);
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

server.listen(3000, () => console.log("Server running at http://localhost:3000"));
