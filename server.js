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
const { requireAuth, requireRole, requirePermission, requireVerified, refreshUserSession } = require('./lib/roleMiddleware');
const { logAction } = require('./lib/auditLog');
const { createVerificationRequest, sendOTP, sendSMSOTP, verifyOTP, getVerificationStatus, updateVerificationDocument, approveVerification, rejectVerification, getPendingVerifications } = require('./lib/verification');
const { createListingApprovalWorkflow, updateListingStatus, getListingApprovalWorkflow, getListingsPendingAdminApproval, getListingsPendingHeadAdminApproval, getAllListingApprovals } = require('./lib/listingApproval');
const { generateVerificationCode, sendVerificationEmail, sendWelcomeEmail } = require('./lib/emailService');

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
// Increase body parser limits to handle large HTML content 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session middleware 
app.use(session({
  secret: process.env.SESSION_SECRET || 'labo-connect-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
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
  if (sessionUser.role !== 'admin' && sessionUser.role !== 'standard') {
    return res.status(403).send('Forbidden');
  }
  return res.sendFile(path.join(__dirname, 'public', 'components', 'admin-dashboard.html'));
});

// Listing Admin Dashboard
app.get('/listing-admin', (req, res) => {
  const sessionUser = req.session && req.session.user;
  if (!sessionUser || !sessionUser.admin_role) {
    return res.status(403).send('Forbidden');
  }
  return res.sendFile(path.join(__dirname, 'public', 'components', 'admin-dashboard.html'));
});

// Verification Admin Dashboard
app.get('/verification-admin', (req, res) => {
  const sessionUser = req.session && req.session.user;
  if (!sessionUser || !sessionUser.admin_role) {
    return res.status(403).send('Forbidden');
  }
  return res.sendFile(path.join(__dirname, 'public', 'components', 'admin-dashboard.html'));
});

// Head Admin Dashboard
app.get('/head-admin', (req, res) => {
  const sessionUser = req.session && req.session.user;
  if (!sessionUser || !sessionUser.admin_role) {
    return res.status(403).send('Forbidden');
  }
  return res.sendFile(path.join(__dirname, 'public', 'components', 'admin-dashboard.html'));
});

// System Admin Content Editor (no traditional dashboard)
app.get('/system-admin', (req, res) => {
  const sessionUser = req.session && req.session.user;
  if (!sessionUser) {
    return res.redirect('/');
  }
  if (sessionUser.admin_role !== 'system_admin') {
    return res.status(403).send('Forbidden');
  }
  // Redirect system admins to the content editor instead of a dashboard
  return res.sendFile(path.join(__dirname, 'public', 'components', 'system-admin-editor.html'));
});

// -------------------
// User Registration
// -------------------
app.post("/register", async (req, res) => {
  const { username, email, password, user_type } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Please fill all required fields" });
  }

  // Validate user_type (business or investor)
  if (!user_type || !['business', 'investor'].includes(user_type)) {
    return res.status(400).json({ error: "user_type must be either 'business' or 'investor'" });
  }

  try {
    // Check if user exists
    const { rows: existing } = await db.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    // If email exists and is verified, reject
    if (existing.length > 0) {
      const existingUser = existing[0];
      if (existingUser.email === email && existingUser.email_verified) {
        return res.status(400).json({ error: "Email already registered and verified" });
      }
      
      // If email exists but NOT verified, allow them to re-register (update the unverified account)
      if (existingUser.email === email && !existingUser.email_verified) {
        // Update the unverified account with new credentials
        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = generateVerificationCode();
        const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000);
        const role = user_type === 'business' ? 'business' : 'investor';
        
        await db.query(
          `UPDATE users SET username = $1, password = $2, role = $3, user_type = $4, verification_code = $5, verification_code_expiry = $6
           WHERE id = $7`,
          [username, hashedPassword, role, user_type, verificationCode, verificationExpiry, existingUser.id]
        );
        
        // Send new verification email
        try {
          await sendVerificationEmail(email, verificationCode, username);
        } catch (emailErr) {
          console.error('Email sending failed:', emailErr.message);
          return res.status(500).json({ error: "Failed to send verification email. Please try again." });
        }
        
        console.log('Unverified account updated with new credentials - new verification code sent');
        
        return res.status(201).json({ 
          message: "New verification code sent to your email! Please check your inbox.", 
          user: { 
            id: existingUser.id, 
            username, 
            email, 
            role,
            user_type,
            email_verified: false
          },
          requiresVerification: true,
          isRetry: true
        });
      }
      
      // Username already exists
      if (existingUser.username === username) {
        return res.status(400).json({ error: "Username already exists" });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine role based on user_type
    const role = user_type === 'business' ? 'business' : 'investor';

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    // Insert user as regular user with user_type (business or investor)
    const { rows } = await db.query(
      `INSERT INTO users (username, email, password, role, user_type, email_verified, verification_code, verification_code_expiry) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, email, role, user_type, created_at`,
      [username, email, hashedPassword, role, user_type, false, verificationCode, verificationExpiry]
    );

    // Send verification email
    try {
      await sendVerificationEmail(email, verificationCode, username);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr.message);
      return res.status(500).json({ error: "Failed to send verification email. Please try again." });
    }

    // Do NOT create a session - user will only be logged in after email verification
    console.log('User account created but NOT logged in - awaiting email verification');

    res.status(201).json({ 
      message: "User registered successfully! Please check your email for the verification code.", 
      user: { 
        id: rows[0].id, 
        username: rows[0].username, 
        email: rows[0].email, 
        role: rows[0].role, 
        user_type: rows[0].user_type,
        email_verified: false
      },
      requiresVerification: true
    });

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
    req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role, user_type: user.user_type, admin_role: user.admin_role, is_verified: user.is_verified };

    // Return user info including role and user_type
    res.json({
      message: "Login successful!",
      user: { id: user.id, username: user.username, email: user.email, role: user.role, user_type: user.user_type, admin_role: user.admin_role, is_verified: user.is_verified }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------
// Email Verification
// -------------------
app.post("/api/verify-email", async (req, res) => {
  const { email, verificationCode } = req.body;

  if (!email || !verificationCode) {
    return res.status(400).json({ error: "Email and verification code are required" });
  }

  try {
    // Find user by email
    const { rows: users } = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = users[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    // Check verification code
    if (user.verification_code !== verificationCode) {
      return res.status(400).json({ error: "Invalid verification code" });
    }

    // Check if code has expired
    if (new Date() > new Date(user.verification_code_expiry)) {
      return res.status(400).json({ error: "Verification code has expired. Please request a new one." });
    }

    // Update user to mark email as verified
    await db.query(
      "UPDATE users SET email_verified = true, verification_code = NULL, verification_code_expiry = NULL WHERE id = $1",
      [user.id]
    );

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.username, user.user_type);
    } catch (emailErr) {
      console.warn('Could not send welcome email:', emailErr.message);
      // Don't fail the verification if welcome email fails
    }

    // NOW create session after email is verified
    req.session.user = { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role, 
      user_type: user.user_type, 
      admin_role: user.admin_role || null, 
      email_verified: true 
    };

    console.log('✅ User email verified and logged in:', user.email);

    res.json({ 
      message: "Email verified successfully! You are now logged in.",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        user_type: user.user_type,
        admin_role: user.admin_role,
        email_verified: true
      },
      isVerified: true
    });

  } catch (err) {
    console.error("Email verification error:", err);
    res.status(500).json({ error: "Server error during verification" });
  }
});

// -------------------
// Resend Verification Code
// -------------------
app.post("/api/resend-verification", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Find user by email
    const { rows: users } = await db.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = users[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({ error: "Email already verified" });
    }

    // Generate new verification code
    const newVerificationCode = generateVerificationCode();
    const verificationExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now

    // Update user with new code
    await db.query(
      "UPDATE users SET verification_code = $1, verification_code_expiry = $2 WHERE id = $3",
      [newVerificationCode, verificationExpiry, user.id]
    );

    // Send verification email
    try {
      await sendVerificationEmail(user.email, newVerificationCode, user.username);
    } catch (emailErr) {
      console.error('Email sending failed:', emailErr.message);
      return res.status(500).json({ error: "Failed to send verification email. Please try again." });
    }

    res.json({ message: "New verification code sent to your email!" });

  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// -------------------
// Session Validation (get current user from server-side session)
// -------------------
app.get("/api/session", async (req, res) => {
  if (req.session.user) {
    // Refresh user data from database
    try {
      const { rows } = await db.query(
        'SELECT id, username, email, role, user_type, admin_role, is_verified FROM users WHERE id = $1',
        [req.session.user.id]
      );
      
      if (rows.length > 0) {
        req.session.user = {
          id: rows[0].id,
          username: rows[0].username,
          email: rows[0].email,
          role: rows[0].role,
          user_type: rows[0].user_type,
          admin_role: rows[0].admin_role,
          is_verified: rows[0].is_verified
        };
      }
    } catch (err) {
      console.warn('Error refreshing session:', err);
    }
    
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
  { name: 'tax_declaration', maxCount: 1 }
]), async (req, res) => {
  // Only authenticated users may submit a listing
  const sessionUser = req.session && req.session.user;
  if (!sessionUser) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  // Only allow business or admin roles to submit listings (check both role and user_type for backwards compatibility)
  const isBusiness = sessionUser.role === 'business' || sessionUser.user_type === 'business';
  const isAdmin = sessionUser.role === 'admin';
  if (!isBusiness && !isAdmin) {
    return res.status(403).json({ error: 'Forbidden: only business or admin accounts may submit listings' });
  }

  // Check if user is verified (for business users)
  try {
    const { rows: users } = await db.query(
      'SELECT is_verified FROM users WHERE id = $1',
      [sessionUser.id]
    );
    
    if (users.length > 0 && !users[0].is_verified) {
      return res.status(403).json({ error: 'User must be verified before submitting listings' });
    }
  } catch (err) {
    console.warn('Could not check verification status:', err.message);
    // Continue if check fails - don't block
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

  // Split owner_name into first and last name (or use as first name if single word)
  const nameParts = owner_name.trim().split(/\s+/);
  const owner_first_name = nameParts[0];
  const owner_last_name = nameParts.slice(1).join(' ') || nameParts[0];

  // Get file URLs
  const imageUrl = files.image ? `/uploads/${files.image[0].filename}` : '';
  const octTctUrl = files.oct_tct ? `/uploads/${files.oct_tct[0].filename}` : '';
  const taxDeclarationUrl = files.tax_declaration ? `/uploads/${files.tax_declaration[0].filename}` : '';

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
    insertCols.push('image_url','oct_tct_url','tax_declaration_url','approved','status','created_at','updated_at');
    values.push(imageUrl, octTctUrl, taxDeclarationUrl, false, 'pending', new Date(), new Date());

    const placeholders = insertCols.map((_, i) => `$${i+1}`).join(', ');
    const sql = `INSERT INTO listings (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING *`;

    const { rows } = await db.query(sql, values);
    const listing = rows[0];
    
    // Create listing approval workflow for admin review
    try {
      await createListingApprovalWorkflow(listing.id, submitterId);
    } catch (e) {
      console.warn('Could not create listing approval workflow:', e.message || e);
      // Don't fail the listing submission if workflow creation fails
    }
    
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

      const fileFields = ['image','oct_tct','tax_declaration'];
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
    // If sender_user_id is provided, verify they are an investor (not business) and are verified
    if (sender_user_id) {
      const { rows: users } = await db.query(
        'SELECT user_type, is_verified FROM users WHERE id = $1',
        [sender_user_id]
      );
      
      if (users.length > 0 && users[0].user_type === 'business') {
        return res.status(403).json({ error: 'Business users cannot send inquiries. Only investors can inquire about listings.' });
      }

      if (users.length > 0 && !users[0].is_verified) {
        return res.status(403).json({ error: 'Your account must be verified before you can send inquiries. Please complete email verification.' });
      }
    }

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
    const ownerName = ((listing.owner_first_name || '') + ' ' + (listing.owner_last_name || '')).trim().toLowerCase();
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

// DELETE: Delete an inquiry
app.delete('/api/inquiries/:id', requireAuth, async (req, res) => {
  try {
    const inquiryId = req.params.id;
    const userId = req.session.user.id;

    // Verify user is the owner or sender of the inquiry
    const { rows: inq } = await db.query('SELECT owner_id, sender_user_id FROM inquiries WHERE id = $1', [inquiryId]);
    if (inq.length === 0) {
      return res.status(404).json({ error: 'Inquiry not found' });
    }

    if (req.session.user.role !== 'admin' && userId !== inq[0].owner_id && userId !== inq[0].sender_user_id) {
      return res.status(403).json({ error: 'You can only delete your own inquiries' });
    }

    // Delete the inquiry
    await db.query('DELETE FROM inquiries WHERE id = $1', [inquiryId]);
    
    res.json({ message: 'Inquiry deleted successfully' });
  } catch (err) {
    console.error('Delete inquiry error:', err);
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
          await db.query('UPDATE email_logs SET status = $1 WHERE id = $2', ['failed', String(e), logId]);
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
          await db.query('UPDATE email_logs SET status = $1 WHERE id = $2', ['failed', String(e), logId]);
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
          await db.query('UPDATE email_logs SET status = $1 WHERE id = $2', ['failed', String(e), logId]);
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
          await db.query('UPDATE email_logs SET status = $1 WHERE id = $2', ['failed', String(e), logId]);
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
        let q = `SELECT listings.id, listings.owner_id, users.email AS owner_email, listings.owner_first_name, listings.owner_last_name, listings.title, listings.type, listings.status, listings.price, listings.size_sqm AS size,
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
        const q = `SELECT listings.id, listings.owner_id, users.email AS owner_email, listings.owner_first_name, listings.owner_last_name, listings.title, listings.type, listings.status, listings.price, listings.size_sqm AS size,
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

    // delete related rows (wrap each in try-catch before transaction ends to avoid aborting it)
    try { await client.query('DELETE FROM uploads_meta WHERE listing_id = $1', [listingId]); } catch(e) { console.warn('Could not delete uploads_meta:', e.message); }
    try { await client.query('DELETE FROM messages WHERE inquiry_id IN (SELECT id FROM inquiries WHERE listing_id = $1)', [listingId]); } catch(e) { console.warn('Could not delete messages:', e.message); }
    try { await client.query('DELETE FROM inquiries WHERE listing_id = $1', [listingId]); } catch(e) { console.warn('Could not delete inquiries:', e.message); }
    try { await client.query('DELETE FROM user_listings WHERE listing_id = $1', [listingId]); } catch(e) { console.warn('Could not delete user_listings:', e.message); }

    // delete the listing (this one should succeed)
    await client.query('DELETE FROM listings WHERE id = $1', [listingId]);

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

    const selectFields = ['l.id', 'l.title', 'l.description', 'l.type', 'l.price', 'l.size_sqm AS size', 'l.image_url', 'l.owner_id', 'l.listing_status', 'u.username AS owner_name'];
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
// User Verification API
// -------------------

// POST: Start verification process
app.post('/api/verification/start', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Check if user already has pending verification
    const existing = await getVerificationStatus(userId);
    if (existing && (existing.status === 'pending' || existing.status === 'otp_sent')) {
      return res.status(400).json({ error: 'Verification already in progress' });
    }
    
    // Create verification request in database
    const verReq = await createVerificationRequest(userId, phoneNumber);
    if (!verReq) {
      return res.status(500).json({ error: 'Failed to create verification request' });
    }
    
    // Send OTP via Supabase
    const otpResult = await sendOTP(verReq.id, phoneNumber);
    
    if (!otpResult.success) {
      return res.status(500).json({ error: otpResult.error || 'Failed to send OTP' });
    }
    
    res.json({
      message: 'Verification started. Check your phone/email for OTP.',
      verificationId: verReq.id,
      otp: process.env.NODE_ENV === 'development' ? '[Check console logs for OTP in dev mode]' : undefined
    });
  } catch (err) {
    console.error('Error starting verification:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Send OTP only (new endpoint - for new flow)
app.post('/api/verification/send-otp', requireAuth, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    
    // Just send OTP, don't create verification request yet
    const otpResult = await sendSMSOTP(phoneNumber);
    
    if (!otpResult.success) {
      return res.status(500).json({ error: otpResult.error || 'Failed to send OTP' });
    }
    
    res.json({
      message: 'OTP sent successfully',
      otp: process.env.NODE_ENV === 'development' ? '[Check console logs for OTP in dev mode]' : undefined
    });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Verify OTP
app.post('/api/verification/verify-otp', requireAuth, async (req, res) => {
  try {
    const { verificationId, otp, phoneNumber } = req.body;
    
    // Accept either verificationId or phoneNumber for backward compatibility
    if (!otp) {
      return res.status(400).json({ error: 'OTP is required' });
    }
    
    // For new flow, just validate OTP format
    if (!verificationId && phoneNumber) {
      // Simple OTP validation - in dev mode, accept any 6-digit code
      if (process.env.NODE_ENV === 'development' && /^\d{6}$/.test(otp)) {
        return res.json({ message: 'OTP verified successfully' });
      } else if (process.env.NODE_ENV !== 'development') {
        // In production, would validate against sent OTP
        return res.json({ message: 'OTP verified successfully' });
      }
      return res.status(400).json({ error: 'Invalid OTP' });
    }
    
    // Old flow - verify with verification ID
    if (verificationId) {
      const result = await verifyOTP(verificationId, otp);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      return res.json({ message: 'OTP verified successfully' });
    }
    
    return res.status(400).json({ error: 'Verification ID or phone number required' });
  } catch (err) {
    console.error('Error verifying OTP:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Submit verification with Firebase (new endpoint - Firebase auth verified)
app.post('/api/verification/submit-firebase', requireAuth, upload.single('idDocument'), async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { phoneNumber, firebaseUid } = req.body;
    
    if (!phoneNumber || !firebaseUid || !req.file) {
      return res.status(400).json({ error: 'Phone number, Firebase UID, and document are required' });
    }
    
    // Create verification request with Firebase UID
    const verReq = await createVerificationRequest(userId, phoneNumber);
    if (!verReq) {
      return res.status(500).json({ error: 'Failed to create verification request' });
    }
    
    // Upload document
    const documentUrl = '/uploads/' + req.file.filename;
    const updateResult = await updateVerificationDocument(verReq.id, documentUrl);
    
    if (!updateResult) {
      return res.status(500).json({ error: 'Failed to save document' });
    }
    
    // Store Firebase UID in database for linking
    try {
      await db.query(
        'UPDATE verification_requests SET firebase_uid = $1 WHERE id = $2',
        [firebaseUid, verReq.id]
      );
    } catch (err) {
      console.warn('Warning: Could not update firebase_uid:', err.message);
      // Don't fail the request if this fails - it's optional
    }
    
    res.json({
      message: 'Verification submitted successfully with Firebase authentication',
      verificationId: verReq.id,
      documentUrl,
      firebaseUid
    });
  } catch (err) {
    console.error('Error submitting Firebase verification:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Submit verification (new endpoint - completes verification after OTP)
app.post('/api/verification/submit', requireAuth, upload.single('idDocument'), async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || !req.file) {
      return res.status(400).json({ error: 'Phone number and document are required' });
    }
    
    // Create verification request at this point (after ID photo and OTP verification)
    const verReq = await createVerificationRequest(userId, phoneNumber);
    if (!verReq) {
      return res.status(500).json({ error: 'Failed to create verification request' });
    }
    
    // Upload document
    const documentUrl = '/uploads/' + req.file.filename;
    const updateResult = await updateVerificationDocument(verReq.id, documentUrl);
    
    if (!updateResult) {
      return res.status(500).json({ error: 'Failed to save document' });
    }
    
    res.json({
      message: 'Verification submitted successfully',
      verificationId: verReq.id,
      documentUrl
    });
  } catch (err) {
    console.error('Error submitting verification:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Upload ID document (old endpoint - kept for backward compatibility)
app.post('/api/verification/upload-document', requireAuth, upload.single('idDocument'), async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { verificationId } = req.body;
    
    if (!verificationId || !req.file) {
      return res.status(400).json({ error: 'Verification ID and document are required' });
    }
    
    const documentUrl = '/uploads/' + req.file.filename;
    
    // Update verification request with document
    const result = await updateVerificationDocument(verificationId, documentUrl);
    
    if (!result) {
      return res.status(500).json({ error: 'Failed to upload document' });
    }
    
    res.json({
      message: 'Document uploaded successfully',
      documentUrl
    });
  } catch (err) {
    console.error('Error uploading document:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: User's verification status
app.get('/api/verification/status', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const status = await getVerificationStatus(userId);
    
    res.json(status || { status: 'not_started' });
  } catch (err) {
    console.error('Error getting verification status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Pending verifications (Verification Admin only)
app.get('/api/admin/verifications/pending', requireRole('verification_admin'), async (req, res) => {
  try {
    const verifications = await getPendingVerifications();
    res.json(verifications);
  } catch (err) {
    console.error('Error getting pending verifications:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Fetch specific verification details
app.get('/api/admin/verification/:id', requireRole('verification_admin'), async (req, res) => {
  try {
    const verificationId = req.params.id;
    
    if (!verificationId) {
      return res.status(400).json({ error: 'Verification ID is required' });
    }
    
    const query = `
      SELECT 
        vr.id,
        vr.user_id,
        vr.status,
        vr.phone_number,
        vr.id_document_url,
        vr.otp_code,
        vr.otp_sent_at,
        vr.otp_verified_at,
        vr.otp_attempts,
        vr.verified_by,
        vr.verified_at,
        vr.rejection_reason,
        vr.created_at,
        vr.updated_at,
        u.username,
        u.email,
        u.role,
        u.user_type
      FROM public.verification_requests vr
      LEFT JOIN public.users u ON vr.user_id = u.id
      WHERE vr.id = $1
    `;
    
    const result = await db.query(query, [verificationId]);
    
    if (!result || result.rows.length === 0) {
      return res.status(404).json({ error: 'Verification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching verification details:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Approve verification by ID (Verification Admin only)
app.post('/api/admin/verification/:id/approve', requireRole('verification_admin'), async (req, res) => {
  try {
    const verificationId = req.params.id;
    const { reason } = req.body;
    const adminId = req.session.user.id;
    
    if (!verificationId) {
      return res.status(400).json({ error: 'Verification ID is required' });
    }
    
    const result = await approveVerification(verificationId);
    
    if (!result) {
      return res.status(500).json({ error: 'Failed to approve verification' });
    }
    
    await logAction(adminId, 'approved_verification', 'verification_requests', verificationId, null, reason || 'approved', req);
    
    res.json({ message: 'Verification approved', verificationId });
  } catch (err) {
    console.error('Error approving verification:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Reject verification by ID (Verification Admin only)
app.post('/api/admin/verification/:id/reject', requireRole('verification_admin'), async (req, res) => {
  try {
    const verificationId = req.params.id;
    const { reason } = req.body;
    const adminId = req.session.user.id;
    
    if (!verificationId) {
      return res.status(400).json({ error: 'Verification ID is required' });
    }
    
    const result = await rejectVerification(verificationId);
    
    if (!result) {
      return res.status(500).json({ error: 'Failed to reject verification' });
    }
    
    await logAction(adminId, 'rejected_verification', 'verification_requests', verificationId, null, reason || 'rejected', req);
    
    res.json({ message: 'Verification rejected', verificationId });
  } catch (err) {
    console.error('Error rejecting verification:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Approve verification (old endpoint - backward compatible)
app.post('/api/admin/verifications/approve', requireRole('verification_admin'), async (req, res) => {
  try {
    const { verificationId } = req.body;
    const adminId = req.session.user.id;
    
    if (!verificationId) {
      return res.status(400).json({ error: 'Verification ID is required' });
    }
    
    const result = await approveVerification(verificationId, adminId);
    
    if (!result) {
      return res.status(500).json({ error: 'Failed to approve verification' });
    }
    
    await logAction(adminId, 'approved_verification', 'verification_requests', verificationId, null, 'approved', req);
    
    res.json({ message: 'Verification approved', verificationId });
  } catch (err) {
    console.error('Error approving verification:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Reject verification (old endpoint - backward compatible)
app.post('/api/admin/verifications/reject', requireRole('verification_admin'), async (req, res) => {
  try {
    const { verificationId, reason } = req.body;
    const adminId = req.session.user.id;
    
    if (!verificationId) {
      return res.status(400).json({ error: 'Verification ID is required' });
    }
    
    const result = await rejectVerification(verificationId, adminId, reason);
    
    if (!result) {
      return res.status(500).json({ error: 'Failed to reject verification' });
    }
    
    await logAction(adminId, 'rejected_verification', 'verification_requests', verificationId, null, reason || 'rejected', req);
    
    res.json({ message: 'Verification rejected', verificationId });
  } catch (err) {
    console.error('Error rejecting verification:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------
// Listing Approval Workflow API
// -------------------

// POST: Submit listing for approval (automatically called when listing is created)
app.post('/api/listings/:listingId/submit-for-approval', requireAuth, async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const userId = req.session.user.id;
    
    // Check if user is verified
    const { rows: userRows } = await db.query(
      'SELECT is_verified FROM users WHERE id = $1',
      [userId]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!userRows[0].is_verified) {
      return res.status(403).json({ error: 'User must be verified before submitting listings' });
    }
    
    // Check if listing exists and belongs to user
    const { rows: listingRows } = await db.query(
      'SELECT id FROM listings WHERE id = $1 AND owner_id = $2',
      [listingId, userId]
    );
    
    if (listingRows.length === 0) {
      return res.status(404).json({ error: 'Listing not found or does not belong to user' });
    }
    
    // Check if approval workflow already exists
    const { rows: existingApproval } = await db.query(
      'SELECT id FROM listing_approvals WHERE listing_id = $1',
      [listingId]
    );
    
    if (existingApproval.length > 0) {
      return res.status(400).json({ error: 'Listing already in approval workflow' });
    }
    
    // Create approval workflow
    const workflow = await createListingApprovalWorkflow(listingId, userId);
    
    if (!workflow) {
      return res.status(500).json({ error: 'Failed to create approval workflow' });
    }
    
    res.json({ message: 'Listing submitted for approval', workflow });
  } catch (err) {
    console.error('Error submitting listing for approval:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Listings pending admin approval (Listing Admin)
app.get('/api/admin/listings/pending-approval', requireRole('listing_admin'), async (req, res) => {
  try {
    const listings = await getListingsPendingAdminApproval();
    res.json(listings);
  } catch (err) {
    console.error('Error getting pending listings:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Listings pending head admin approval
app.get('/api/admin/listings/pending-head-admin', requireRole('head_admin'), async (req, res) => {
  try {
    console.log('[HEAD ADMIN] Fetching pending head admin listings...');
    const listings = await getListingsPendingHeadAdminApproval();
    console.log(`[HEAD ADMIN] Found ${listings.length} listings pending approval`);
    if (listings.length > 0) {
      console.log('[HEAD ADMIN] First listing:', listings[0]);
    }
    res.json(listings);
  } catch (err) {
    console.error('Error getting listings pending head admin:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Approve listing (Listing Admin)
app.post('/api/admin/listings/:listingId/approve', requireRole('listing_admin'), async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const adminId = req.session.user.id;
    const { notes } = req.body;
    
    console.log(`[LISTING APPROVAL] Approving listing ${listingId} by admin ${adminId}`);
    
    // Verify listing exists
    const { rows } = await db.query(
      'SELECT id FROM listings WHERE id = $1',
      [listingId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Check if approval workflow exists
    const { rows: workflowCheck } = await db.query(
      'SELECT id FROM listing_approvals WHERE listing_id = $1',
      [listingId]
    );
    
    if (workflowCheck.length === 0) {
      console.log(`[LISTING APPROVAL] No workflow found, creating one for listing ${listingId}`);
      // Create workflow if it doesn't exist (fallback for listings created before workflow system)
      const ownerQuery = await db.query(
        'SELECT owner_id FROM listings WHERE id = $1',
        [listingId]
      );
      if (ownerQuery.rows.length > 0) {
        await createListingApprovalWorkflow(listingId, ownerQuery.rows[0].owner_id);
      }
    }
    
    const workflow = await updateListingStatus(listingId, 'admin_approved', adminId, notes, req);
    
    if (!workflow) {
      console.log(`[LISTING APPROVAL] Failed to update listing ${listingId}`);
      return res.status(500).json({ error: 'Failed to approve listing' });
    }
    
    console.log(`[LISTING APPROVAL] Successfully approved listing ${listingId}`, workflow);
    res.json({ message: 'Listing approved by admin', workflow });
  } catch (err) {
    console.error('Error approving listing:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Head admin approves and publishes listing
app.post('/api/admin/listings/:listingId/publish', requireRole('head_admin'), async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const adminId = req.session.user.id;
    const { notes } = req.body;
    
    console.log(`[LISTING PUBLISH] Publishing listing ${listingId} by admin ${adminId}`);
    
    // Verify listing exists and is in correct state
    const { rows: listingRows } = await db.query(
      'SELECT id FROM listings WHERE id = $1',
      [listingId]
    );
    
    if (listingRows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    const { rows: approvalRows } = await db.query(
      'SELECT listing_status FROM listing_approvals WHERE listing_id = $1',
      [listingId]
    );
    
    if (approvalRows.length === 0) {
      console.log(`[LISTING PUBLISH] No approval workflow found for listing ${listingId}`);
      return res.status(400).json({ error: 'Listing approval workflow not found. Please ensure listing was submitted for approval first.' });
    }
    
    const currentStatus = approvalRows[0].listing_status;
    if (currentStatus !== 'admin_approved') {
      console.log(`[LISTING PUBLISH] Listing ${listingId} is in state "${currentStatus}", expected "admin_approved"`);
      return res.status(400).json({ error: `Listing is in state "${currentStatus}", expected "admin_approved"` });
    }
    
    const workflow = await updateListingStatus(listingId, 'published', adminId, notes, req);
    
    if (!workflow) {
      return res.status(500).json({ error: 'Failed to publish listing' });
    }
    
    console.log(`[LISTING PUBLISH] Successfully published listing ${listingId}`);
    res.json({ message: 'Listing published', workflow });
  } catch (err) {
    console.error('Error publishing listing:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Reject listing
app.post('/api/admin/listings/:listingId/reject', requireRole('listing_admin', 'head_admin'), async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const adminId = req.session.user.id;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    // Verify listing exists
    const { rows } = await db.query(
      'SELECT id FROM listings WHERE id = $1',
      [listingId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    const workflow = await updateListingStatus(listingId, 'rejected', adminId, reason, req);
    
    if (!workflow) {
      return res.status(500).json({ error: 'Failed to reject listing' });
    }
    
    res.json({ message: 'Listing rejected', workflow });
  } catch (err) {
    console.error('Error rejecting listing:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------
// Listing Sold Functionality
// -------------------

// POST: Mark a listing as sold
app.post('/api/listings/:listingId/mark-sold', requireAuth, async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const userId = req.session.user.id;
    const { buyerId, inquiryId, salePrice } = req.body;
    
    if (!buyerId || !salePrice) {
      return res.status(400).json({ error: 'Buyer ID and sale price are required' });
    }
    
    // Verify the listing exists and belongs to the current user
    const { rows: listings } = await db.query(
      'SELECT id, owner_id, price FROM listings WHERE id = $1',
      [listingId]
    );
    
    if (listings.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    if (listings[0].owner_id !== userId) {
      return res.status(403).json({ error: 'You can only mark your own listings as sold' });
    }
    
    // Create sales transaction
    const { rows: transaction } = await db.query(
      `INSERT INTO public.sales_transactions (listing_id, seller_id, buyer_id, inquiry_id, sale_price)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, sale_date`,
      [listingId, userId, buyerId, inquiryId, salePrice]
    );
    
    // Update listing as sold
    await db.query(
      `UPDATE listings SET listing_status = 'sold', sold_to_user_id = $1, sold_date = NOW()
       WHERE id = $2`,
      [buyerId, listingId]
    );
    
    // Note: inquiries table doesn't have a status column, so we can't mark them as completed/closed
    // The mark as sold functionality will be tracked through the listing_status field and sales_transactions table
    
    res.json({ 
      message: 'Listing marked as sold',
      transaction: transaction[0]
    });
  } catch (err) {
    console.error('Error marking listing as sold:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Business dashboard - sold listings
app.get('/api/business/dashboard/sold-listings', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Verify user is business
    const { rows: user } = await db.query(
      'SELECT user_type FROM users WHERE id = $1',
      [userId]
    );
    
    if (!user || user[0].user_type !== 'business') {
      return res.status(403).json({ error: 'Only business users can access this' });
    }
    
    const { rows: soldListings } = await db.query(
      `SELECT 
        st.id as transaction_id,
        l.id as listing_id,
        l.title,
        l.description,
        st.sale_price,
        st.sale_date,
        u.username as buyer_name,
        u.email as buyer_email,
        st.inquiry_id
      FROM public.sales_transactions st
      JOIN listings l ON st.listing_id = l.id
      JOIN users u ON st.buyer_id = u.id
      WHERE st.seller_id = $1
      ORDER BY st.sale_date DESC`,
      [userId]
    );
    
    // Calculate total earnings
    const { rows: earnings } = await db.query(
      `SELECT COALESCE(SUM(sale_price), 0) as total_earned, COUNT(*) as total_sold
       FROM public.sales_transactions
       WHERE seller_id = $1`,
      [userId]
    );
    
    res.json({
      soldListings,
      earnings: {
        totalEarned: earnings[0].total_earned,
        totalSold: earnings[0].total_sold
      }
    });
  } catch (err) {
    console.error('Error fetching business dashboard:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Investor dashboard - bought listings
app.get('/api/investor/dashboard/bought-listings', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    // Verify user is investor
    const { rows: user } = await db.query(
      'SELECT user_type FROM users WHERE id = $1',
      [userId]
    );
    
    if (!user || user[0].user_type !== 'investor') {
      return res.status(403).json({ error: 'Only investor users can access this' });
    }
    
    const { rows: boughtListings } = await db.query(
      `SELECT 
        st.id as transaction_id,
        l.id as listing_id,
        l.title,
        l.description,
        st.sale_price,
        st.sale_date,
        u.username as seller_name,
        u.email as seller_email,
        st.inquiry_id
      FROM public.sales_transactions st
      JOIN listings l ON st.listing_id = l.id
      JOIN users u ON st.seller_id = u.id
      WHERE st.buyer_id = $1
      ORDER BY st.sale_date DESC`,
      [userId]
    );
    
    // Calculate total spent
    const { rows: spending } = await db.query(
      `SELECT COALESCE(SUM(sale_price), 0) as total_spent, COUNT(*) as total_bought
       FROM public.sales_transactions
       WHERE buyer_id = $1`,
      [userId]
    );
    
    res.json({
      boughtListings,
      spending: {
        totalSpent: spending[0].total_spent,
        totalBought: spending[0].total_bought
      }
    });
  } catch (err) {
    console.error('Error fetching investor dashboard:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Upload success story
app.post('/api/success-stories', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { listingId, imageUrl, location, businessName, description, businessType, category, establishedYear, keyAchievement, contactEmail } = req.body;

    // Verify user is investor
    const { rows: user } = await db.query(
      'SELECT user_type FROM users WHERE id = $1',
      [userId]
    );

    if (!user || user[0].user_type !== 'investor') {
      return res.status(403).json({ error: 'Only investor users can upload success stories' });
    }

    // Verify listing was bought by this investor
    const { rows: transaction } = await db.query(
      'SELECT id FROM public.sales_transactions WHERE buyer_id = $1 AND listing_id = $2',
      [userId, listingId]
    );

    if (!transaction || transaction.length === 0) {
      return res.status(403).json({ error: 'You can only share stories for listings you have purchased' });
    }

    // Insert success story with pending status
    const { rows: story } = await db.query(
      `INSERT INTO public.success_stories (
        investor_id, listing_id, image_url, location, business_name, 
        description, business_type, established_year, key_achievement, contact_email, status, category
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11)
      RETURNING id, investor_id, listing_id, image_url, location, business_name, 
                description, business_type, established_year, key_achievement, 
                contact_email, status, category, created_at`,
      [userId, listingId, imageUrl, location, businessName, description, businessType, establishedYear, keyAchievement, contactEmail, category]
    );

    res.status(201).json({
      message: 'Success story submitted for approval',
      story: story[0]
    });
  } catch (err) {
    console.error('Error uploading success story:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: All approved success stories (public view)
app.get('/api/success-stories', async (req, res) => {
  try {
    const { rows: stories } = await db.query(
      `SELECT 
        ss.id,
        ss.investor_id,
        ss.listing_id,
        ss.image_url,
        ss.location,
        ss.business_name,
        ss.description,
        ss.business_type,
        ss.established_year,
        ss.key_achievement,
        ss.contact_email,
        ss.status,
        ss.category,
        ss.created_at,
        u.username as investor_name,
        u.email as investor_email
      FROM public.success_stories ss
      JOIN users u ON ss.investor_id = u.id
      WHERE ss.status = 'approved'
      ORDER BY ss.created_at DESC`
    );

    res.json(stories);
  } catch (err) {
    console.error('Error fetching success stories:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Single success story (only if approved)
app.get('/api/success-stories/:storyId', async (req, res) => {
  try {
    const storyId = req.params.storyId;
    
    const { rows: story } = await db.query(
      `SELECT 
        ss.id,
        ss.investor_id,
        ss.listing_id,
        ss.image_url,
        ss.location,
        ss.business_name,
        ss.description,
        ss.business_type,
        ss.established_year,
        ss.key_achievement,
        ss.contact_email,
        ss.status,
        ss.category,
        ss.created_at,
        u.username as investor_name,
        u.email as investor_email
      FROM public.success_stories ss
      JOIN users u ON ss.investor_id = u.id
      WHERE ss.id = $1 AND ss.status = 'approved'`,
      [storyId]
    );

    if (!story || story.length === 0) {
      return res.status(404).json({ error: 'Success story not found' });
    }

    res.json(story[0]);
  } catch (err) {
    console.error('Error fetching success story:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Pending success stories for listing admin approval
app.get('/api/admin/success-stories/pending', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;

    // Check if user is listing admin or head admin
    const { rows: adminUser } = await db.query(
      `SELECT role FROM users WHERE id = $1 AND (role IN ('listing_admin', 'head_admin') OR admin_role IN ('listing_admin', 'head_admin'))`,
      [userId]
    );

    if (!adminUser || adminUser.length === 0) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get pending stories
    const { rows: stories } = await db.query(
      `SELECT 
        ss.id,
        ss.investor_id,
        ss.listing_id,
        ss.image_url,
        ss.location,
        ss.business_name,
        ss.description,
        ss.business_type,
        ss.established_year,
        ss.key_achievement,
        ss.contact_email,
        ss.status,
        ss.category,
        ss.created_at,
        u.username as investor_name,
        u.email as investor_email,
        l.title as listing_title
      FROM public.success_stories ss
      JOIN users u ON ss.investor_id = u.id
      JOIN listings l ON ss.listing_id = l.id
      WHERE ss.status IN ('pending', 'listing_admin_approved')
      ORDER BY ss.created_at ASC`
    );

    res.json(stories);
  } catch (err) {
    console.error('Error fetching pending success stories:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH: Listing admin approve success story
app.patch('/api/admin/success-stories/:storyId/listing-admin-approve', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const storyId = req.params.storyId;
    const { notes } = req.body;

    // Check if user is listing admin
    const { rows: adminUser } = await db.query(
      `SELECT role FROM users WHERE id = $1 AND (role IN ('listing_admin', 'head_admin') OR admin_role IN ('listing_admin', 'head_admin'))`,
      [userId]
    );

    if (!adminUser || adminUser.length === 0) {
      return res.status(403).json({ error: 'Listing admin access required' });
    }

    // Update story status
    const { rows: updated } = await db.query(
      `UPDATE public.success_stories
       SET status = 'listing_admin_approved',
           listing_admin_notes = $1,
           approved_by_listing_admin_id = $2,
           updated_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [notes || '', userId, storyId]
    );

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'Story not found or already processed' });
    }

    res.json({ message: 'Story approved by listing admin', story: updated[0] });
  } catch (err) {
    console.error('Error approving success story:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH: Head admin final approval
app.patch('/api/admin/success-stories/:storyId/head-admin-approve', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const storyId = req.params.storyId;
    const { notes } = req.body;

    // Check if user is head admin
    const { rows: adminUser } = await db.query(
      `SELECT role FROM users WHERE id = $1 AND (role = 'head_admin' OR admin_role = 'head_admin')`,
      [userId]
    );

    if (!adminUser || adminUser.length === 0) {
      return res.status(403).json({ error: 'Head admin access required' });
    }

    // Update story status
    const { rows: updated } = await db.query(
      `UPDATE public.success_stories
       SET status = 'approved',
           head_admin_notes = $1,
           approved_by_head_admin_id = $2,
           approved_at = NOW(),
           updated_at = NOW()
       WHERE id = $3 AND status = 'listing_admin_approved'
       RETURNING *`,
      [notes || '', userId, storyId]
    );

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'Story not found or not at listing admin approval stage' });
    }

    res.json({ message: 'Story approved and published', story: updated[0] });
  } catch (err) {
    console.error('Error finalizing success story approval:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH: Reject success story
app.patch('/api/admin/success-stories/:storyId/reject', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const storyId = req.params.storyId;
    const { notes } = req.body;

    // Check if user is admin
    const { rows: adminUser } = await db.query(
      `SELECT role FROM users WHERE id = $1 AND (role IN ('listing_admin', 'head_admin') OR admin_role IN ('listing_admin', 'head_admin'))`,
      [userId]
    );

    if (!adminUser || adminUser.length === 0) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Update story status
    const { rows: updated } = await db.query(
      `UPDATE public.success_stories
       SET status = 'rejected',
           head_admin_notes = $1,
           approved_by_head_admin_id = $2,
           updated_at = NOW()
       WHERE id = $3 AND status IN ('pending', 'listing_admin_approved')
       RETURNING *`,
      [notes || '', userId, storyId]
    );

    if (!updated || updated.length === 0) {
      return res.status(404).json({ error: 'Story not found or already processed' });
    }

    res.json({ message: 'Story rejected', story: updated[0] });
  } catch (err) {
    console.error('Error rejecting success story:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: Listing approval workflow details
// GET: Get listing details by ID
app.get('/api/listings/:listingId', async (req, res) => {
  try {
    const listingId = req.params.listingId;
    
    const { rows } = await db.query(
      'SELECT id, title, description, price, user_id, listing_status FROM listings WHERE id = $1',
      [listingId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching listing:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/listings/:listingId/approval-status', async (req, res) => {
  try {
    const listingId = req.params.listingId;
    const workflow = await getListingApprovalWorkflow(listingId);
    
    if (!workflow) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    res.json(workflow);
  } catch (err) {
    console.error('Error getting listing approval status:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: All listing approvals (Head Admin)
app.get('/api/admin/listings/approvals', requireRole('head_admin'), async (req, res) => {
  try {
    const approvals = await getAllListingApprovals();
    res.json(approvals);
  } catch (err) {
    console.error('Error getting all listing approvals:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------
// Admin Session and Management
// -------------------

// GET: Current user's role and permissions
app.get('/api/admin/user-info', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    
    const { rows } = await db.query(
      'SELECT id, username, email, role, admin_role, is_verified FROM users WHERE id = $1',
      [userId]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = rows[0];
    
    // Get permissions
    let permissions = [];
    if (user.admin_role) {
      const { rows: permRows } = await db.query(
        'SELECT permission FROM role_permissions WHERE admin_role = $1',
        [user.admin_role]
      );
      permissions = permRows.map(r => r.permission);
    }
    
    res.json({
      user,
      permissions
    });
  } catch (err) {
    console.error('Error getting user info:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET: All admin users
app.get('/api/admin/all-admins', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, username, email, admin_role FROM users WHERE role = $1 ORDER BY created_at DESC',
      ['admin']
    );
    
    res.json(rows);
  } catch (err) {
    console.error('Error getting all admins:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST: Create admin user (Head Admin only)
app.post('/api/admin/create-admin', requireAuth, async (req, res) => {
  try {
    const { username, email, password, adminRole } = req.body;
    const creatorId = req.session.user.id;
    const creatorAdminRole = req.session.user.admin_role;
    
    if (!username || !email || !password || !adminRole) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Check creator's admin role and validate permissions
    let canCreateRole = false;
    
    if (creatorAdminRole === 'head_admin') {
      // Head Admin can create: head_admin, listing_admin, verification_admin, system_admin
      canCreateRole = ['head_admin', 'listing_admin', 'verification_admin', 'system_admin'].includes(adminRole);
    } else if (creatorAdminRole === 'listing_admin') {
      // Listing Admin can only create: listing_admin
      canCreateRole = adminRole === 'listing_admin';
    } else if (creatorAdminRole === 'verification_admin') {
      // Verification Admin can only create: verification_admin
      canCreateRole = adminRole === 'verification_admin';
    } else {
      // Regular users cannot create admins
      return res.status(403).json({ error: 'You do not have permission to create admin accounts' });
    }
    
    if (!canCreateRole) {
      return res.status(403).json({ error: `You can only create ${creatorAdminRole === 'head_admin' ? 'head_admin, listing_admin, verification_admin, or system_admin' : adminRole} accounts` });
    }
    
    // Validate admin role exists
    const { rows: roleRows } = await db.query(
      'SELECT role_name FROM admin_roles WHERE role_name = $1',
      [adminRole]
    );
    
    if (roleRows.length === 0) {
      return res.status(400).json({ error: 'Invalid admin role' });
    }
    
    // Check if user already exists
    const { rows: existingRows } = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    
    if (existingRows.length > 0) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create admin user
    const { rows: newUserRows } = await db.query(
      `INSERT INTO users (username, email, password, role, admin_role, is_verified)
       VALUES ($1, $2, $3, 'admin', $4, TRUE)
       RETURNING id, username, email, role, admin_role`,
      [username, email, hashedPassword, adminRole]
    );
    
    const newUser = newUserRows[0];
    
    await logAction(creatorId, 'created_admin_user', 'users', newUser.id, null, adminRole, req);
    
    res.status(201).json({
      message: 'Admin user created successfully',
      user: newUser
    });
  } catch (err) {
    console.error('Error creating admin user:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------
// System Admin Content Management
// -------------------
// GET: Fetch current index.html content
app.get('/api/system-admin/content/index', requireRole('system_admin'), async (req, res) => {
  try {
    const indexPath = path.join(__dirname, 'public', 'components', 'index.html');
    const content = fs.readFileSync(indexPath, 'utf8');
    res.json({ content });
  } catch (err) {
    console.error('Error reading index.html:', err);
    res.status(500).json({ error: 'Failed to read content' });
  }
});

// POST: Update index.html content
app.post('/api/system-admin/content/index', requireRole('system_admin'), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    // Validate that content is a string
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }

    // Check content length to prevent saving massive strings
    if (content.length > 10 * 1024 * 1024) { // 10MB limit
      return res.status(413).json({ error: 'Content too large (max 10MB)' });
    }
    
    const indexPath = path.join(__dirname, 'public', 'components', 'index.html');
    
    // Create backup before updating
    const backupPath = path.join(__dirname, 'public', 'components', 'index.html.backup');
    const currentContent = fs.readFileSync(indexPath, 'utf8');
    fs.writeFileSync(backupPath, currentContent);
    
    // Write new content
    fs.writeFileSync(indexPath, content, 'utf8');
    
    // Log the action
    const userId = req.session.user.id;
    await logAction(userId, 'updated_index_content', 'website_content', null, null, 'index.html updated', req);
    
    res.json({ message: 'Content updated successfully', backup: true });
  } catch (err) {
    console.error('Error updating index.html:', err);
    
    // Handle JSON parsing errors
    if (err instanceof SyntaxError) {
      return res.status(400).json({ error: 'Invalid JSON format in request' });
    }
    
    res.status(500).json({ error: 'Failed to update content: ' + err.message });
  }
});

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
