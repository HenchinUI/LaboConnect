LaboConnect System Architecture
Generated: 2025-12-09

================================================================================
OVERVIEW
================================================================================

LaboConnect is a full-stack Node.js/Express + PostgreSQL web application designed 
for managing real estate listings and inquiries. It includes role-based admin 
dashboards, user authentication, file uploads, and real-time messaging via Socket.IO.

================================================================================
HIGH-LEVEL ARCHITECTURE DIAGRAM
================================================================================

┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER (Browser)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │   index.html     │  │  listings.html   │  │ inquiries.html   │         │
│  │ (Public landing, │  │ (Browse & search │  │  (Chat/messages  │         │
│  │  submit listing) │  │   for listings)  │  │   for inquiries) │         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│  │ admin-dashboard. │  │  authModal.html  │  │ listing-detail.  │         │
│  │      html        │  │ (Login/Register) │  │      html        │         │
│  │ (Admin panel for │  │                  │  │ (View single     │         │
│  │  approvals, etc) │  │                  │  │  listing details)│         │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ JavaScript Layer (global.js, admin.js, home.js, business.js)      │   │
│  │ - User session management & authentication                        │   │
│  │ - Form submission & validation                                   │   │
│  │ - Modal/UI interactions                                          │   │
│  │ - Fetch API calls to backend                                     │   │
│  │ - Socket.IO client for real-time messaging                       │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ CSS Layer (global.css, home.css + inline styles)                  │   │
│  │ - Responsive design (mobile-first breakpoints)                    │   │
│  │ - Color scheme, typography, components                           │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ HTTP/HTTPS
                                    │ WebSocket (Socket.IO)
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NODE.JS / EXPRESS SERVER LAYER                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │ Express App (server.js)                                            │   │
│  │ - Routes for auth (login, register, logout)                       │   │
│  │ - Routes for listings (submit, browse, approve, reject, delete)   │   │
│  │ - Routes for inquiries & messages (send, fetch, chat)             │   │
│  │ - Session middleware (express-session)                            │   │
│  │ - File upload handling (multer)                                   │   │
│  │ - Admin token generation & validation                             │   │
│  │ - Role-based access control (RBAC)                                │   │
│  │ - Protected routes (admin-dashboard, API endpoints)               │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  Key Endpoints:                                                             │
│  ├─ POST /register          - Create new user (with optional admin token)  │
│  ├─ POST /login             - Authenticate user                           │
│  ├─ POST /logout            - Destroy session                             │
│  ├─ GET /api/session        - Fetch current user session                  │
│  ├─ POST /submit-listing    - Create new listing (business/admin only)    │
│  ├─ GET /admin/listings     - Fetch listings (filtered by status)         │
│  ├─ POST /admin/approve-listing/:id   - Approve a listing                 │
│  ├─ POST /admin/listings/:id/reject   - Reject a listing                  │
│  ├─ DELETE /admin/listings/:id        - Delete listing + cleanup files    │
│  ├─ POST /api/inquiries     - Send inquiry on a listing                   │
│  ├─ GET /api/inquiries      - Fetch inquiries (user's own or admin all)   │
│  ├─ GET /admin/stats        - Admin dashboard statistics                  │
│  ├─ GET /admin-dashboard    - Protected route (serves admin HTML)         │
│  ├─ POST /api/admin/tokens  - Generate admin token (admin-only)           │
│  └─ Socket.IO events (messages, inquiries)                                │
│                                                                             │
│  Middleware Stack:                                                          │
│  ├─ express.json()          - Parse JSON bodies                           │
│  ├─ express.urlencoded()    - Parse form data                             │
│  ├─ session middleware      - Server-side sessions (httpOnly cookies)     │
│  ├─ express.static()        - Serve static files (public/)                │
│  ├─ multer                  - File upload handling                        │
│  └─ Admin protection        - Block unauthorized access to admin panel    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ SQL Queries
                                    │ Connection Pool
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER (PostgreSQL)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Database Name: db_4c25                                                    │
│  Host: dpg-d4oou9idbo4c73f984rg-a.singapore-postgres.render.com           │
│  Connection: pg (node-postgres pool)                                       │
│                                                                             │
│  Tables (10 total):                                                        │
│  ├─ users                    - User accounts, roles, auth credentials     │
│  ├─ listings                 - Real estate listings (pending/approved)    │
│  ├─ inquiries                - Inquiries sent by interested parties       │
│  ├─ messages                 - Chat messages within inquiries             │
│  ├─ user_listings            - Join table (users ↔ listings)             │
│  ├─ uploads_meta             - Metadata for uploaded files               │
│  ├─ admin_tokens             - Admin invitation tokens (single-use)      │
│  ├─ notification_preferences - User email opt-in settings                │
│  ├─ email_logs               - Log of sent emails & status               │
│  └─ locations                - Geographic POIs (map data)                │
│                                                                             │
│  Key Relationships:                                                         │
│  ├─ users.id ← listings.owner_id (listings belong to users)              │
│  ├─ listings.id ← inquiries.listing_id (inquiries are about listings)    │
│  ├─ inquiries.id ← messages.inquiry_id (messages are in inquiries)       │
│  ├─ users.id ← messages.sender_user_id (messages sent by users)          │
│  ├─ users.id ← user_listings.user_id, listings.id ← user_listings.listing_id
│  ├─ listings.id ← uploads_meta.listing_id (files associated with listing)│
│  ├─ users.id ← admin_tokens.created_by (tokens created by admins)       │
│  └─ users.id ← notification_preferences.user_id (1:1 per user)          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ File System I/O
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FILE SYSTEM LAYER (Local Disk)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  public/uploads/              - Uploaded files (images, documents)         │
│  - Original filenames stored in uploads_meta table                        │
│  - Served via static route /uploads                                       │
│                                                                             │
│  Supported files:                                                           │
│  ├─ image.png/jpg/jpeg/gif   - Listing photos                             │
│  ├─ oct_tct_url              - OCT/TCT documents                          │
│  ├─ tax_declaration_url      - Tax declarations                           │
│  ├─ doas_url                 - DOAS documents                             │
│  └─ government_id_url        - Government ID scans                        │
│                                                                             │
│  Note: Files are deleted from disk when listings are deleted (cleanup).    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

================================================================================
DATA FLOW DIAGRAMS
================================================================================

1) USER REGISTRATION FLOW
─────────────────────────────────────────────────────────────────────────────

Browser                                  Server                  Database
  │                                        │                        │
  │─── Form Fill (register modal) ────────→│                        │
  │    [username, email, password, role]   │                        │
  │                                        │                        │
  │                                  If role='admin':               │
  │                                  Validate admin_token           │
  │                                  Check if unused & not expired  │
  │                                        │                        │
  │                                        │── Query users ────────→│
  │                                        │ (check if email exists) │
  │                                        │←──────────────────────│
  │                                        │                        │
  │                                  Hash password (bcrypt)         │
  │                                        │                        │
  │                                        │── INSERT user ────────→│
  │                                        │                        │
  │                                  If admin: Mark token used      │
  │                                        │── UPDATE admin_token ─→│
  │                                        │                        │
  │                                  Set req.session.user           │
  │                                        │                        │
  │←────── JSON response ─────────────────│                        │
  │    [success, user object]              │                        │
  │                                        │                        │
  │── Redirect to dashboard ──────────────→│                        │
  │    (admin users → /admin-dashboard)    │                        │

2) LISTING SUBMISSION & APPROVAL FLOW
─────────────────────────────────────────────────────────────────────────────

Business User                            Server                  Database
    │                                      │                        │
    │── Submit listing ──────────────────→│                        │
    │  (title, type, price, images, docs) │                        │
    │                                      │                        │
    │                                 Check auth:                   │
    │                                 - Is user logged in?          │
    │                                 - Role is business/admin?     │
    │                                      │                        │
    │                                 Handle file uploads:          │
    │                                 - Multer saves to /uploads    │
    │                                 - Record metadata in DB       │
    │                                      │── INSERT listing ─────→│
    │                                      │  (status='pending')    │
    │                                      │← listing id            │
    │                                      │── INSERT uploads_meta ─→
    │                                      │                        │
    │←─── Success response ──────────────│                        │
    │
    │
Admin                                     Server                  Database
    │                                      │                        │
    │── View admin dashboard ────────────→│                        │
    │   (GET /admin-dashboard)             │                        │
    │                                      │── GET /admin/listings ──→
    │                                      │  (status='pending')     │
    │                                      │←─────────────────────│
    │←─── Dashboard HTML + listings ────│                        │
    │                                      │                        │
    │── Click approve/reject ────────────→│                        │
    │   (POST /admin/approve-listing/:id)  │                        │
    │                                      │── UPDATE listing ─────→│
    │                                      │  (status='approved')    │
    │                                      │←─────────────────────│
    │←─── Success toast ─────────────────│                        │
    │                                      │                        │
    │── View refreshes ──────────────────→│                        │
    │   (GET /admin/listings?status=approved)
    │                                      │←─────────────────────│

3) INQUIRY & MESSAGING FLOW
─────────────────────────────────────────────────────────────────────────────

Investor                                  Server                Database
    │                                      │                       │
    │── View listing ────────────────────→│                       │
    │   (GET /components/listing-detail)   │                       │
    │←─── HTML + listing details ────────│                       │
    │                                      │                       │
    │── Send inquiry ────────────────────→│                       │
    │  (first_name, email, message, etc)   │                       │
    │                                      │── INSERT inquiry ────→│
    │                                      │  (listing_id, sender) │
    │                                      │←──────────────────────│
    │←─── Success message ───────────────│                       │
    │                                      │                       │
    │                                      │───────────────────────→
    │                                      │ Email notification to listing owner
    │
    │─── User types reply message ───────→│                       │
    │  (in inquiries.html)                 │                       │
    │                                      │── INSERT message ────→│
    │                                      │  (inquiry_id, body)   │
    │                                      │←──────────────────────│
    │                                      │                       │
    │                                 Socket.IO broadcast          │
    │←──────────────────────────────────│                       │
    │    (Real-time message update)        │                       │
    │                                      │                       │

4) ADMIN TOKEN GENERATION FLOW
─────────────────────────────────────────────────────────────────────────────

Admin User (logged in)                   Server                  Database
    │                                      │                       │
    │── View admin dashboard ────────────→│                       │
    │                                      │                       │
    │── Click "Generate Admin Token" ────→│                       │
    │   (POST /api/admin/tokens)           │                       │
    │                                      │                       │
    │                                 Check if user role='admin'    │
    │                                 Generate random 40-char token │
    │                                 (crypto.randomBytes)          │
    │                                      │                       │
    │                                      │── INSERT admin_token ─→
    │                                      │  (token, created_by)  │
    │                                      │←──────────────────────│
    │←─── JSON response ─────────────────│                       │
    │  [token string, copy button]         │                       │
    │                                      │                       │
    │── Admin copies token ──────────────→│ (clipboard)           │
    │                                      │                       │
    │── Sends to new admin user ─────────→ (out-of-band, email/msg)
    │                                      │                       │
    │                                 New user registers:           │
    │                                 Role = 'admin', Token = copied
    │                                      │── Validate token ────→│
    │                                      │  (exists, unused, valid)
    │                                      │← Confirm             │
    │                                      │                       │
    │                                      │── INSERT user ────────→
    │                                      │── UPDATE admin_token ─→
    │                                      │  (used=TRUE, used_by)  │
    │                                      │←──────────────────────│

================================================================================
KEY ARCHITECTURAL DECISIONS
================================================================================

1) AUTHENTICATION & AUTHORIZATION
   - Server-side session storage using express-session + PostgreSQL
   - Passwords hashed with bcrypt (never stored plaintext)
   - Role-based access control (RBAC): guest, user, business, admin
   - Admin token single-use validation on registration
   - Protected routes check req.session.user on every request

2) FILE UPLOADS
   - Multer handles multipart form data
   - Files stored in public/uploads/ with unique filenames
   - Metadata (original filename, field name) tracked in uploads_meta table
   - Files deleted from disk when listing is deleted (cleanup in transaction)
   - Served via static route /uploads

3) REAL-TIME MESSAGING
   - Socket.IO for WebSocket support
   - Inquiries are threaded conversations
   - Messages stored in database, cached in memory during session
   - Broadcast to sender & listing owner in real-time

4) LISTING WORKFLOW
   - Listings start in 'pending' status
   - Admin must approve (status='approved') or reject (status='rejected')
   - Only business/admin users can submit; server enforces via authentication
   - Separate views for pending/approved/rejected in admin dashboard
   - Bulk actions for admin efficiency (approve/reject/delete multiple)

5) ADMIN TOKEN SYSTEM
   - Tokens generated by existing admins
   - Single-use, optional expiry
   - Prevents anyone from creating admin accounts
   - Tokens stored plaintext (security recommendation: hash tokens)

6) RESPONSIVE DESIGN
   - Mobile-first CSS with breakpoints at 480px, 760px, 1024px
   - Grid layouts use flex fallbacks on smaller screens
   - Touch-friendly button sizes (40px+)

================================================================================
DEPLOYMENT ARCHITECTURE
================================================================================

Client (Browser)
  ↓
  ├─→ Static Assets (CSS, JS, HTML) served by Express / nginx
  ├─→ HTTP REST API calls (JSON)
  └─→ WebSocket (Socket.IO)
       ↓
Node.js Express Server (localhost:3000 or cloud)
  ├─→ Route handlers (authentication, listings, inquiries)
  ├─→ File system (public/uploads/)
  └─→ PostgreSQL connection pool (pg library)
       ↓
PostgreSQL Database (Render, AWS RDS, self-hosted)
  └─→ 10 tables, users, listings, inquiries, messages, etc.

Production Notes:
- SSL/TLS for HTTPS (recommended)
- Environment variables for DB connection string, session secret, API keys
- Rate limiting on API endpoints
- CORS configuration if frontend hosted separately
- Regular database backups
- File storage cleanup (old/deleted listings)

================================================================================
CURRENT FEATURES & CAPABILITIES
================================================================================

USER-FACING FEATURES
├─ Browse & search listings (public)
├─ Submit listings (business users only)
├─ Send inquiries to listing owners
├─ Real-time messaging in inquiries
├─ View listing details (map, photos, documents)
├─ User dashboard (business owners)
├─ Notification preferences

ADMIN FEATURES
├─ Admin dashboard (pending/approved/rejected views)
├─ Approve or reject listings
├─ Re-approve rejected listings
├─ Delete listings (with file cleanup)
├─ Bulk actions (select multiple, approve/reject/delete at once)
├─ View inquiry details
├─ Generate admin tokens
├─ View admin statistics (active, pending, approved counts)

SECURITY FEATURES
├─ Password hashing (bcrypt)
├─ Server-side sessions (not localStorage)
├─ RBAC (role-based access control)
├─ Admin token requirement for admin registration
├─ Protected routes (admin-dashboard requires auth + role check)
├─ File upload validation (via multer)
├─ CSRF protection via session cookies (httpOnly, secure flags)

================================================================================
KNOWN LIMITATIONS & FUTURE IMPROVEMENTS
================================================================================

Limitations:
├─ Admin tokens stored plaintext (should hash)
├─ Limited email notification system (basic SendGrid support)
├─ No advanced search/filtering UI (backend supports it)
├─ File size limits not enforced (should add)
├─ No user profile customization
├─ Maps feature limited (just lat/lng storage, no advanced UI)

Future Enhancements:
├─ Token hashing in admin_tokens table
├─ Advanced search filters (price range, location, type)
├─ User profile customization & avatar uploads
├─ Payment integration for listing boosts
├─ Automated listing expiry
├─ Email digest notifications
├─ Admin audit logs
├─ API rate limiting
├─ CDN for image optimization & caching
├─ Admin bulk exports (CSV)
├─ Calendar view for property viewings

================================================================================
END OF ARCHITECTURE DOCUMENTATION
================================================================================
