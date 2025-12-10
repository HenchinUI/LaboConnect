# LaboConnect - System Architecture

## 1. Overview

LaboConnect is a full-stack web application for commercial property listings and business inquiries in Labo, Camarines Norte, Philippines. It enables users to browse properties, submit listings, and communicate with property owners.

**Tech Stack:**
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Real-time:** Socket.io
- **Maps:** Leaflet + OpenStreetMap
- **Authentication:** JWT-based sessions with PostgreSQL store
- **Email:** SendGrid/Nodemailer

---

## 2. Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENT LAYER (Browser)                │
│  HTML/CSS/JavaScript - Responsive Web Interface         │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP/WebSocket
                         ▼
┌─────────────────────────────────────────────────────────┐
│              APPLICATION LAYER (Express.js)             │
│  - REST API Endpoints                                   │
│  - WebSocket handlers                                   │
│  - Authentication & Authorization                       │
│  - File Upload/Processing                               │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│            DATA ACCESS LAYER (PostgreSQL)               │
│  - User Management                                      │
│  - Listings & Properties                                │
│  - Messages & Inquiries                                 │
│  - Sessions & Notifications                             │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Database Schema

### Core Tables

#### `users`
- `id` (Primary Key)
- `email`, `password_hash`
- `first_name`, `last_name`
- `role` (guest, business, admin)
- `profile_picture_url`
- `bio`, `phone`, `address`
- `created_at`, `updated_at`

#### `listings`
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `title`, `description`
- `type` (For Sale, For Lease, For Rent)
- `price`, `size_sqm`
- `latitude`, `longitude`
- `image_url`
- `status` (pending, approved, rejected)
- `created_at`, `updated_at`

#### `inquiries`
- `id` (Primary Key)
- `listing_id` (Foreign Key → listings)
- `sender_id` (Foreign Key → users)
- `receiver_id` (Foreign Key → users)
- `subject`, `message`
- `read_at`
- `created_at`

#### `messages`
- `id` (Primary Key)
- `inquiry_id` (Foreign Key → inquiries)
- `sender_id` (Foreign Key → users)
- `content`
- `attachment_url`
- `read_at`
- `deleted_at`
- `created_at`

#### `notifications`
- `id` (Primary Key)
- `user_id` (Foreign Key → users)
- `type` (listing_approved, inquiry_received, message_received)
- `related_id` (listing_id or inquiry_id)
- `read_at`
- `created_at`

#### `sessions` (connect-pg-simple)
- `sid` (Session ID)
- `sess` (Session data JSON)
- `expire` (Expiration timestamp)

---

## 4. API Endpoints

### Authentication
```
POST   /register              - Create new user account
POST   /login                 - Authenticate user
POST   /logout                - Destroy user session
GET    /api/session           - Get current session info
```

### User Profile
```
GET    /api/profile/:userId           - Get user profile (private)
PUT    /api/profile/:userId           - Update user profile
POST   /api/profile/:userId/picture   - Upload profile picture
GET    /api/profile/:userId/public    - Get public profile
```

### Listings
```
POST   /submit-listing                      - Submit new listing with documents
GET    /api/user/:userId/listings           - Get user's listings
GET    /api/my-listings/:status             - Get current user's listings by status
PUT    /api/my-listings/:listingId          - Update listing
DELETE /api/my-listings/:listingId          - Delete listing
POST   /api/my-listings/:listingId/image    - Upload listing image
GET    /api/approved-listings               - Get all approved listings
GET    /api/listing/:id                     - Get single listing details
GET    /api/listing-details/:id             - Get detailed listing view
GET    /api/locations                       - Get location markers for map
POST   /api/locations                       - Save location pin
```

### Inquiries & Messages
```
POST   /api/inquiries                       - Create inquiry
GET    /api/inquiries                       - Get user's inquiries
GET    /api/inquiries/:id/messages          - Get messages in conversation
POST   /api/inquiries/:id/messages          - Send message
POST   /api/inquiries/:id/messages/upload   - Upload message attachment
PATCH  /api/inquiries/:id/read              - Mark inquiry as read
PATCH  /api/messages/:id/delete             - Soft delete message
PATCH  /api/messages/:id/read               - Mark message as read
GET    /api/inquiries/count                 - Get unread inquiry count
```

### Notifications
```
GET    /api/listing-notifications           - Get user notifications
GET    /api/listing-notifications/count     - Get unread notification count
PATCH  /api/listing-notifications/:id/read  - Mark notification as read
```

### Admin
```
GET    /admin-dashboard                  - Admin dashboard page
GET    /admin/listings/:status           - Get listings by status (pending/approved/rejected)
POST   /admin/listings/:id/approve       - Approve listing
POST   /admin/listings/:id/reject        - Reject listing
```

### Search & Utilities
```
GET    /api/users/search                 - Search users by name/email
POST   /api/test                         - Database connection test
```

---

## 5. Frontend Structure

### Pages & Components

```
public/
├── components/
│   ├── index.html              - Home page & listing submission form
│   ├── header.html             - Navigation header (imported)
│   ├── footer.html             - Footer (imported)
│   ├── map.html                - Interactive Leaflet map view
│   ├── listing-detail.html     - Single listing details
│   ├── listings.html           - Browse all listings
│   ├── profile.html            - User profile management
│   ├── public-profile.html     - Public user profile view
│   ├── search-users.html       - User search interface
│   ├── conversations.html      - Message conversations
│   ├── inquiries.html          - Inquiry management
│   ├── admin-dashboard.html    - Admin panel for approvals
│   ├── authModal.html          - Login/signup modal
│   ├── economicdata.html       - Economic data display
│   ├── signup.html             - Signup page variant
│   └── WARNING.html            - Warning/disclaimer page
├── css/
│   ├── global.css              - Global styles & variables
│   └── home.css                - Home page specific styles
├── js/
│   ├── global.js               - Shared utilities (auth, modals, requests)
│   ├── home.js                 - Home page functionality
│   ├── admin.js                - Admin dashboard logic
│   ├── profile.js              - User profile logic
│   ├── business.js             - Business features
│   ├── search-users.js         - User search logic
│   ├── profile-listings.js     - Listing management logic
│   └── public-profile.js       - Public profile view logic
└── uploads/                    - User uploaded files
    ├── documents/              - OCT, TCT, Tax declarations
    └── images/                 - Listing & profile images
```

---

## 6. Key Features Architecture

### 6.1 Authentication Flow
```
User Input (Email/Password)
        ↓
    /register or /login
        ↓
    Hash password (bcryptjs)
        ↓
    Store in PostgreSQL
        ↓
    Create Session (express-session)
        ↓
    Store in PostgreSQL sessions table
        ↓
    Set HttpOnly Cookie
        ↓
    Authenticated State
```

### 6.2 Listing Submission Flow
```
User fills form with:
- Property details (title, type, price, size)
- Coordinates (Leaflet map picker)
- Required documents (OCT, TCT, DOAS, Tax Declaration, Gov ID)
- Property image
        ↓
Upload to /submit-listing (multipart/form-data)
        ↓
Multer stores files in public/uploads/
        ↓
Store metadata in listings table (status: 'pending')
        ↓
Create notification for admin
        ↓
Socket.io triggers admin dashboard update
        ↓
Admin reviews and approves/rejects
        ↓
Send email notification to user
```

### 6.3 Location Mapping
```
User clicks "Select Location on Map"
        ↓
Leaflet modal opens (centered on Labo, 14.153887, 122.828522)
        ↓
User clicks on map to place marker
        ↓
Coordinates update in form fields
        ↓
Confirm selection
        ↓
Modal closes, form fields populated
        ↓
Coordinates stored with listing
```

### 6.4 Real-time Messaging
```
User A sends inquiry to listing owner
        ↓
POST /api/inquiries (creates conversation)
        ↓
Socket.io emits 'inquiry' event
        ↓
User B receives real-time notification
        ↓
Messages in conversation thread
        ↓
POST /api/inquiries/:id/messages
        ↓
Socket.io emits 'message' event to both users
        ↓
Message appears in real-time
```

---

## 7. Session Management

### Current Implementation
- **Store:** PostgreSQL (connect-pg-simple)
- **Cookie:** HttpOnly, 24-hour expiration
- **Production:** Secure flag enabled
- **Table:** `session` table with auto-cleanup

**Why PostgreSQL Sessions?**
- Persistent across server restarts
- Supports multiple server instances (horizontal scaling)
- No memory leaks
- Auto-cleanup of expired sessions

---

## 8. File Upload Architecture

### Multer Configuration
```
Destination: public/uploads/
Naming: [timestamp]-[random].ext
Preserved extensions based on original file

Document types accepted:
- Images: .jpg, .jpeg, .png
- PDFs: .pdf

Limits enforced by input accept attributes
```

### Upload Routes
```
Profile Picture:    POST /api/profile/:userId/picture
Listing Documents:  POST /submit-listing (multiple fields)
Listing Image:      POST /api/my-listings/:listingId/image
Message Attachment: POST /api/inquiries/:id/messages/upload
```

---

## 9. Security Features

### Implemented
- ✅ **Password Hashing:** bcryptjs with salt rounds
- ✅ **Session Security:** HttpOnly cookies, PostgreSQL store
- ✅ **CORS:** Configured for same-origin requests
- ✅ **Admin Paths:** Protected middleware checks role
- ✅ **File Upload:** Extension validation, unique filenames
- ✅ **Environment Variables:** Sensitive data in .env
- ✅ **SQL Injection Prevention:** Parameterized queries (pg library)

### Recommended Enhancements
- Add CSRF tokens for state-changing operations
- Implement rate limiting on auth endpoints
- Add request validation middleware
- Use HTTPS in production
- Implement API key authentication for sensitive endpoints
- Add audit logging for admin actions

---

## 10. Deployment Architecture

### Current Setup
```
Local Development:
- Express server on port 3000 (default)
- PostgreSQL connection to Render.com
- File storage in public/uploads
```

### Production Recommendation
```
┌──────────────────────────────────────┐
│       Client (Browser)                │
│   https://yourdomain.com              │
└────────────┬─────────────────────────┘
             │ HTTPS
             ▼
┌──────────────────────────────────────┐
│  Load Balancer / Reverse Proxy         │
│  (nginx or similar)                    │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Node.js App Server(s)                │
│  (Multiple instances)                 │
│  - Session store: PostgreSQL          │
│  - File storage: Cloud (S3/GCS)       │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  PostgreSQL Database                  │
│  (Managed service: Render/AWS/Azure)  │
└──────────────────────────────────────┘

External Services:
- SendGrid: Email notifications
- Leaflet/OSM: Map tiles
```

---

## 11. Data Flow Diagrams

### New Listing Approval Flow
```
User submits listing
        ↓
POST /submit-listing
        ↓
Files saved to public/uploads/
        ↓
Record inserted into listings table
        ↓
Status: 'pending'
        ↓
Socket.io notifies admin
        ↓
Admin dashboard displays new listing
        ↓
Admin reviews documents & details
        ↓
Admin clicks Approve/Reject
        ↓
POST /admin/listings/:id/approve (or reject)
        ↓
Update listings.status
        ↓
Create notification for user
        ↓
Send email to user
        ↓
Socket.io updates user's dashboard
```

### Message Exchange Flow
```
User A on listing page
        ↓
Clicks "Send Inquiry"
        ↓
Fills inquiry form
        ↓
POST /api/inquiries
        ↓
Create inquiry record
        ↓
Socket.io: 'new_inquiry' event
        ↓
User B (listing owner) sees notification
        ↓
Clicks to open conversation
        ↓
GET /api/inquiries/:id/messages
        ↓
Messages load
        ↓
User B types reply
        ↓
POST /api/inquiries/:id/messages
        ↓
Message inserted
        ↓
Socket.io: 'new_message' event
        ↓
User A receives message in real-time
        ↓
Socket.io: 'message_read' event when opened
```

---

## 12. Environment Variables (.env)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Session
SESSION_SECRET=your-secret-key-change-in-production

# Email
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=noreply@laboconnect.com

# File Upload
MAX_FILE_SIZE=5242880  # 5MB

# Server
PORT=3000
NODE_ENV=production
```

---

## 13. Performance Considerations

### Current Bottlenecks
1. **Image serving:** Direct from filesystem (consider CDN)
2. **Database queries:** No connection pooling optimization
3. **Real-time updates:** Socket.io broadcasts to all connected clients
4. **Session table:** Can grow large (needs periodic cleanup)

### Optimization Recommendations
1. Implement Redis for caching listings
2. Use CDN (Cloudflare/Cloudfront) for static files
3. Add database indexing on frequently queried columns
4. Implement pagination for listings
5. Use gzip compression for API responses
6. Consider lazy loading for images

---

## 14. Scalability Path

### Phase 1: Current
- Single server instance
- PostgreSQL on managed service
- File storage: local filesystem

### Phase 2: Horizontal Scaling
- Multiple app servers behind load balancer
- Sessions in PostgreSQL (already implemented)
- File storage: S3/Google Cloud Storage
- Redis for caching

### Phase 3: Advanced
- Microservices for notifications, email
- Message queue (RabbitMQ/Kafka)
- Elasticsearch for user/listing search
- CDN for static assets
- Database replication/sharding

---

## 15. Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3, JavaScript | ES6+ |
| **Backend** | Node.js, Express.js | 5.2.1 |
| **Database** | PostgreSQL | 12+ |
| **Authentication** | express-session, bcryptjs | 1.18.2, 3.0.3 |
| **Real-time** | Socket.io | 4.8.0 |
| **File Upload** | Multer | 2.0.2 |
| **Maps** | Leaflet, OpenStreetMap | 1.9.4 |
| **Email** | SendGrid, Nodemailer | 8.1.6, 7.0.11 |
| **Testing** | Jest, Supertest | 29.0.0, 6.3.3 |

---

## 16. Future Enhancements

1. **Mobile App:** React Native/Flutter version
2. **Advanced Search:** Elasticsearch integration
3. **Payment Processing:** Stripe/PayMongo integration
4. **Video Calls:** Jitsi/WebRTC for property tours
5. **ML-based Recommendations:** Similar listing suggestions
6. **Analytics Dashboard:** Admin insights on listings/users
7. **Multi-language Support:** i18n implementation
8. **Dark Mode:** Theme switching
9. **Progressive Web App:** Service worker support
10. **API Documentation:** Swagger/OpenAPI specs

---

## 17. Contact & Support

For questions about this architecture, refer to:
- `/docs/ARCHITECTURE.md` - High-level design
- `/migrations/` - Database schema evolution
- `server.js` - API endpoint implementations
- `/public/js/` - Frontend logic
