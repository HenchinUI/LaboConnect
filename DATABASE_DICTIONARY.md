# LaboConnect Database Dictionary

## Overview
This document provides a comprehensive guide to all tables, columns, and their purposes in the LaboConnect PostgreSQL database.

---

## Table of Contents
1. [User Management Tables](#user-management-tables)
2. [Listing & Property Tables](#listing--property-tables)
3. [Transaction Tables](#transaction-tables)
4. [Admin & Verification Tables](#admin--verification-tables)
5. [Communication Tables](#communication-tables)
6. [Utility Tables](#utility-tables)

---

## User Management Tables

### `users`
Stores all user accounts including business owners, investors, and admin users.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique user identifier |
| username | VARCHAR(50) | UNIQUE | User's login username |
| email | VARCHAR(100) | UNIQUE | User's email address |
| password | VARCHAR(255) | - | Hashed password |
| role | VARCHAR(20) | - | User role: 'user', 'admin', 'investor', 'business' |
| admin_role | VARCHAR(50) | - | Admin type: 'head_admin', 'system_admin', 'verification_admin', 'listing_admin' |
| user_type | VARCHAR(50) | - | Account type: 'business', 'investor' |
| created_at | TIMESTAMP | - | Account creation date |
| contact_number | TEXT | - | User's contact phone number |
| bio | TEXT | - | User biography/description |
| profile_picture_url | TEXT | - | Path to profile image |
| is_verified | BOOLEAN | - | Whether user has completed verification |
| verification_status | VARCHAR(20) | - | Status: 'unverified', 'pending', 'verified' |
| verified_at | TIMESTAMP | - | Date user was verified |
| verified_by | INTEGER | FK | Admin ID who verified the user |
| phone_number | VARCHAR(20) | - | Formatted phone number |
| id_document_url | VARCHAR(255) | - | URL to government ID document |
| id_document_verified | BOOLEAN | - | Whether ID document has been verified |
| email_verified | BOOLEAN | - | Whether email has been verified |
| verification_code | VARCHAR(6) | - | OTP code for email verification |
| verification_code_expiry | TIMESTAMP | - | When verification code expires |

**Usage**: Core table for user authentication and profile management.

---

### `verification_requests`
Tracks user identity verification submissions with documents and OTP verification.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique verification request ID |
| user_id | INTEGER | FK | Reference to users table |
| status | VARCHAR(20) | - | Status: 'pending_admin_review', 'verified', 'rejected', 'otp_sent' |
| phone_number | VARCHAR(20) | - | Phone number submitted for verification |
| id_document_url | VARCHAR(255) | - | URL to ID document photo/scan |
| otp_code | VARCHAR(6) | - | One-time password sent via email |
| otp_sent_at | TIMESTAMP | - | When OTP was sent |
| otp_verified_at | TIMESTAMP | - | When OTP was confirmed |
| otp_attempts | INTEGER | - | Number of OTP verification attempts |
| email | VARCHAR(255) | - | Email address being verified |
| selfie_photo_url | VARCHAR(500) | - | URL to selfie photo for identity verification |
| verified_by | INTEGER | FK | ID of admin who approved verification |
| verified_at | TIMESTAMP | - | Date verification was approved |
| rejection_reason | TEXT | - | Reason for rejection if status is 'rejected' |
| created_at | TIMESTAMP | - | Request submission date |
| updated_at | TIMESTAMP | - | Last update date |

**Usage**: Manages two-factor identity verification process with OTP and document submission.

---

### `notification_preferences`
User preferences for email notifications.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique preference ID |
| user_id | INTEGER | FK | Reference to users table |
| email_new_inquiry | BOOLEAN | - | Whether to receive email for new inquiries (default: true) |
| email_digest | BOOLEAN | - | Whether to receive digest emails (default: true) |
| created_at | TIMESTAMP | - | Record creation date |

**Usage**: Stores user notification preferences to control email communications.

---

## Listing & Property Tables

### `listings`
Core table storing all property listings in the platform.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique listing ID |
| owner_id | INTEGER | FK | ID of listing owner (from users table) |
| owner_first_name | VARCHAR(100) | - | Owner's first name |
| owner_last_name | VARCHAR(100) | - | Owner's last name |
| owner_name | VARCHAR(255) | - | Full owner name |
| title | VARCHAR(255) | - | Property listing title |
| description | TEXT | - | Detailed property description |
| type | VARCHAR(50) | - | Property type: 'For Sale', 'For Lease', 'For Rent' |
| size_sqm | NUMERIC(10,2) | - | Property size in square meters |
| price | NUMERIC(12,2) | - | Listed price |
| latitude | NUMERIC(10,6) | - | Property latitude for map display |
| longitude | NUMERIC(10,6) | - | Property longitude for map display |
| image_url | VARCHAR(500) | - | Path to main property image |
| oct_tct_url | VARCHAR(500) | - | URL to Original Certificate of Title |
| tax_declaration_url | VARCHAR(500) | - | URL to tax declaration document |
| doas_url | VARCHAR(500) | - | URL to DOAS document |
| government_id_url | VARCHAR(500) | - | URL to owner's government ID |
| status | VARCHAR(50) | - | Admin approval status: 'pending', 'approved', 'rejected' |
| approved | BOOLEAN | - | Legacy approval flag |
| listing_status | VARCHAR(50) | - | Listing visibility: 'active', 'sold', 'archived' |
| views | INTEGER | - | Number of times listing was viewed |
| inquiries | INTEGER | - | Number of inquiries received |
| rejection_reason | TEXT | - | Reason for rejection if status is 'rejected' |
| sold_to_user_id | INTEGER | FK | ID of buyer if listing is sold |
| sold_date | TIMESTAMP | - | Date listing was marked as sold |
| created_at | TIMESTAMP | - | Listing creation date |
| updated_at | TIMESTAMP | - | Last modification date |

**Usage**: Main table storing all property information and listings visible to users.

---

### `listing_approvals`
Tracks the approval workflow for listings through multiple admin levels.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique approval record ID |
| listing_id | INTEGER | FK | Reference to listings table |
| listing_status | VARCHAR(50) | - | Current approval status: 'submitted', 'admin_approved', 'published', 'rejected' |
| submitted_at | TIMESTAMP | - | When listing was submitted for approval |
| submitted_by | INTEGER | FK | ID of user who submitted listing |
| admin_approved_at | TIMESTAMP | - | When listing_admin approved |
| admin_approved_by | INTEGER | FK | ID of listing_admin who approved |
| admin_notes | TEXT | - | Notes from listing_admin |
| head_admin_approved_at | TIMESTAMP | - | When head_admin gave final approval |
| head_admin_approved_by | INTEGER | FK | ID of head_admin who approved |
| head_admin_notes | TEXT | - | Notes from head_admin |
| rejected_at | TIMESTAMP | - | When listing was rejected |
| rejection_reason | TEXT | - | Detailed reason for rejection |
| created_at | TIMESTAMP | - | Record creation date |
| updated_at | TIMESTAMP | - | Last update date |

**Approval Workflow**: submitted → admin_approved → head_admin approval → published OR rejected

**Usage**: Manages the two-tier approval system for property listings.

---

### `listing_notifications`
Notifies users about changes to their listings.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique notification ID |
| user_id | INTEGER | FK | ID of user being notified |
| listing_id | INTEGER | FK | ID of listing being notified about |
| listing_title | TEXT | - | Title of the listing for display |
| status | TEXT | - | Notification type: 'approved', 'rejected', 'published', 'system_admin_approved' |
| reason | TEXT | - | Additional context for notification |
| is_read | BOOLEAN | - | Whether user has read notification |
| created_at | TIMESTAMP | - | Notification creation date |

**Usage**: Real-time notifications for listing owners about approval/rejection status changes.

---

### `locations`
Geographic reference points for notable areas and landmarks.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique location ID |
| title | VARCHAR(255) | - | Location/landmark name |
| description | TEXT | - | Location description |
| type | VARCHAR(100) | - | Type: 'Business', 'Resort', 'Hotel & Restaurant' |
| latitude | NUMERIC(10,6) | - | Location latitude |
| longitude | NUMERIC(10,6) | - | Location longitude |
| price | NUMERIC(10,2) | - | Reference price (if applicable) |
| created_at | TIMESTAMP | - | Record creation date |
| updated_at | TIMESTAMP | - | Last modification date |

**Usage**: Stores reference locations for map display and geographic context.

---

## Transaction Tables

### `sales_transactions`
Records completed property sales/leases between buyers and sellers.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique transaction ID |
| listing_id | INTEGER | FK | ID of listing being sold |
| seller_id | INTEGER | FK | ID of property owner (seller) |
| buyer_id | INTEGER | FK | ID of buyer/investor |
| inquiry_id | INTEGER | FK | Original inquiry that led to sale |
| sale_price | NUMERIC(12,2) | - | Final agreed price |
| sale_date | TIMESTAMP | - | Date transaction was completed |
| created_at | TIMESTAMP | - | Record creation date |

**Usage**: Tracks completed property transactions and provides sales history.

---

### `inquiries`
Stores inquiries from interested buyers about listings.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique inquiry ID |
| listing_id | INTEGER | FK | ID of property being inquired about |
| sender_user_id | INTEGER | FK | ID of inquiring user |
| owner_id | INTEGER | FK | ID of listing owner |
| full_name | TEXT | - | Inquirer's full name |
| email | TEXT | - | Inquirer's email address |
| contact_number | TEXT | - | Inquirer's phone number |
| company | TEXT | - | Company name (if applicable) |
| message | TEXT | - | Inquiry message |
| is_read | BOOLEAN | - | Whether owner has read inquiry |
| created_at | TIMESTAMP | - | Inquiry submission date |

**Usage**: Facilitates communication between potential buyers and property owners.

---

### `messages`
Stores conversation messages between inquiry participants.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique message ID |
| inquiry_id | INTEGER | FK | Parent inquiry ID |
| sender_user_id | INTEGER | FK | ID of message sender |
| sender_name | TEXT | - | Sender's display name |
| sender_email | TEXT | - | Sender's email address |
| body | TEXT | - | Message content |
| attachment_stored | TEXT | - | System filename of attachment |
| attachment_original | TEXT | - | Original filename of attachment |
| is_read | BOOLEAN | - | Whether recipient has read message |
| deleted | BOOLEAN | - | Soft delete flag |
| created_at | TIMESTAMP | - | Message timestamp |

**Usage**: Stores message threads within an inquiry conversation.

---

### `email_logs`
Logs all outgoing emails sent by the system.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique email log entry ID |
| user_id | INTEGER | FK | ID of user receiving email |
| inquiry_id | INTEGER | FK | Related inquiry (if applicable) |
| email_address | TEXT | - | Recipient email address |
| subject | TEXT | - | Email subject line |
| status | TEXT | - | Email status: 'pending', 'sent', 'failed' |
| sent_at | TIMESTAMP | - | When email was sent |
| created_at | TIMESTAMP | - | Log entry creation date |

**Usage**: Audit trail for all emails sent for compliance and debugging.

---

## Admin & Verification Tables

### `admin_roles`
Defines available admin role types and their descriptions.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique role ID |
| role_name | VARCHAR(50) | UNIQUE | System role name: 'head_admin', 'system_admin', 'verification_admin', 'listing_admin' |
| display_name | VARCHAR(100) | - | Human-readable role name |
| description | TEXT | - | Role description and responsibilities |
| created_at | TIMESTAMP | - | When role was created |

**Role Types**:
- **head_admin**: Full system access, final approval authority
- **system_admin**: Manages content, approves listings and success stories
- **verification_admin**: Verifies user identities
- **listing_admin**: Approves property listings

**Usage**: Defines permission structure and admin hierarchy.

---

### `role_permissions`
Maps permissions to admin roles (permission-based access control).

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique permission mapping ID |
| admin_role | VARCHAR(50) | - | Role name from admin_roles table |
| permission | VARCHAR(100) | - | Permission identifier |
| created_at | TIMESTAMP | - | When permission was assigned |

**Common Permissions**:
- `view_submitted_listings`
- `approve_listings_initial`
- `approve_listings_final`
- `verify_user_identity`
- `view_all_verifications`
- `manage_admins`
- `publish_all_listings`
- `edit_index_page`

**Usage**: Fine-grained access control for admin functions.

---

### `admin_tokens`
Temporary tokens for admin operations or special access.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique token ID |
| token | TEXT | UNIQUE | Token value |
| created_by | INTEGER | FK | Admin who created token |
| created_at | TIMESTAMP | - | Token creation date |
| expires_at | TIMESTAMP | - | Token expiration (null = never expires) |
| used | BOOLEAN | - | Whether token has been used |
| used_by | INTEGER | FK | ID of user who used token |
| used_at | TIMESTAMP | - | When token was used |

**Usage**: Manages one-time or temporary admin access tokens.

---

### `audit_logs`
Complete audit trail of all admin actions for compliance and debugging.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique audit log entry ID |
| admin_id | INTEGER | FK | ID of admin performing action |
| action | VARCHAR(100) | - | Action type: 'created_admin_user', 'updated_admin_user', 'listing_admin_approved', etc. |
| target_table | VARCHAR(50) | - | Table affected (e.g., 'users', 'listings', 'verification_requests') |
| target_id | INTEGER | - | ID of record affected |
| old_value | TEXT | - | Previous value (for updates) |
| new_value | TEXT | - | New value (for updates) |
| ip_address | VARCHAR(50) | - | IP address of admin |
| user_agent | TEXT | - | Browser/client information |
| created_at | TIMESTAMP | - | Log timestamp |

**Usage**: Comprehensive audit trail for regulatory compliance and security monitoring.

---

### `account_notifications`
Notifies users of changes made to their accounts by admins.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique notification ID |
| user_id | INTEGER | FK | ID of user being notified |
| change_type | TEXT | - | Type of change: 'account_changed', 'status_changed' |
| change_description | TEXT | - | Details of what was changed |
| reason | TEXT | - | Reason provided by admin |
| admin_id | INTEGER | FK | ID of admin who made change |
| is_read | BOOLEAN | - | Whether user has read notification |
| created_at | TIMESTAMP | - | Notification date |

**Usage**: Notifies users of administrative account modifications.

---

## Communication Tables

### `success_stories`
Stores success stories submitted by investors about their investments.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique story ID |
| investor_id | INTEGER | FK | ID of investor submitting story |
| listing_id | INTEGER | FK | ID of related property listing |
| business_name | VARCHAR(255) | - | Business name |
| business_type | VARCHAR(100) | - | Type of business |
| category | VARCHAR(50) | - | Story category: 'retail', 'resort', 'hotel', etc. |
| location | VARCHAR(255) | - | Business location |
| description | TEXT | - | Story description |
| image_url | TEXT | - | URL to success story image |
| established_year | INTEGER | - | Year business was established |
| key_achievement | TEXT | - | Main achievement to highlight |
| contact_email | VARCHAR(255) | - | Contact email for story |
| status | VARCHAR(50) | - | Status: 'pending', 'published', 'rejected', 'system_admin_approved' |
| system_admin_notes | TEXT | - | Notes from system_admin |
| head_admin_notes | TEXT | - | Notes from head_admin |
| approved_by_system_admin_id | INTEGER | FK | ID of system_admin who approved |
| approved_by_head_admin_id | INTEGER | FK | ID of head_admin who approved |
| approved_at | TIMESTAMP | - | Final approval date |
| created_at | TIMESTAMP | - | Submission date |
| updated_at | TIMESTAMP | - | Last modification date |

**Usage**: Features investor success stories and investment results on platform.

---

## Utility Tables

### `economic_data`
Stores economic indicators and statistics about the region.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique data entry ID |
| key | TEXT | UNIQUE | Data identifier (e.g., 'population', 'business_distribution') |
| value | TEXT | - | Data value (can be JSON array for multiple values) |
| label | TEXT | - | Display label for the data |
| icon | TEXT | - | Emoji or icon to display |
| updated_at | TIMESTAMP | - | Last data update date |
| updated_by | INTEGER | FK | ID of admin who updated |

**Common Keys**:
- `population`: Current population count
- `population_data`: Array of population trend data
- `businesses`: Number of businesses
- `business_change`: Growth percentage
- `business_distribution`: Array of business types distribution

**Usage**: Powers economic dashboard and statistics display on frontend.

---

### `uploads_meta`
Metadata tracking for all file uploads.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique upload record ID |
| listing_id | INTEGER | FK | ID of related listing |
| field_name | TEXT | - | Form field name ('image', 'oct_tct', 'tax_declaration', etc.) |
| stored_filename | TEXT | - | System-generated filename on server |
| original_filename | TEXT | - | Original filename from user's device |
| created_at | TIMESTAMP | - | Upload date |

**Usage**: Maintains record of all uploaded files for recovery and auditing.

---

### `user_listings`
Associates users with saved/favorite listings.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique association ID |
| user_id | INTEGER | FK | ID of user |
| listing_id | INTEGER | FK | ID of listing |
| created_at | TIMESTAMP | - | When listing was saved |

**Constraints**: Unique constraint on (user_id, listing_id) prevents duplicates

**Usage**: Stores user's saved/favorite listings.

---

### `session`
Express session store for user login sessions.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| sid | VARCHAR | PRIMARY | Session ID |
| sess | JSON | - | Serialized session data (user info, preferences) |
| expire | TIMESTAMP | - | Session expiration time |

**Usage**: Maintains user login sessions. Automatically cleaned up after expiration.

---

### `migration_log`
Tracks database schema migrations.

| Column | Type | Key | Description |
|--------|------|-----|-------------|
| id | INTEGER | PRIMARY | Unique migration ID |
| name | VARCHAR(255) | UNIQUE | Migration filename |
| executed_at | TIMESTAMP | - | When migration was run |
| status | VARCHAR(50) | - | Migration status: 'completed', 'failed' |

**Usage**: Ensures each migration runs only once and tracks database evolution.

---

## Key Relationships & Workflows

### User Registration & Verification
1. User creates account → `users` table
2. User submits ID + selfie → `verification_requests` table
3. Verification admin reviews → `audit_logs` records action
4. User receives notification → `account_notifications` table
5. `users.is_verified` set to true

### Listing Submission & Approval
1. Business owner creates listing → `listings` table
2. System creates approval record → `listing_approvals` table (status: 'submitted')
3. Listing admin reviews → updates `listing_approvals` (status: 'admin_approved')
4. Head admin final review → updates `listing_approvals` (status: 'published' or 'rejected')
5. User notified → `listing_notifications` table
6. All actions logged → `audit_logs` table

### Property Inquiry & Sales
1. Buyer views listing and inquires → `inquiries` table
2. Conversation happens → `messages` table
3. Transaction agreed → `sales_transactions` table
4. Listing marked as sold → `listings.listing_status = 'sold'`
5. Investor creates success story → `success_stories` table

### Admin Actions
- All admin actions logged to `audit_logs`
- User notifications created for account changes → `account_notifications`
- Listing status changes trigger notifications → `listing_notifications`
- Email logs track all communications → `email_logs`

---

## Indexing Strategy

**Performance Indexes**:
- `listings` indexed by: status, approved, created_at, coordinates
- `listing_approvals` indexed by: listing_id, listing_status
- `users` indexed by: user_type, is_verified, admin_role
- `verification_requests` indexed by: user_id, status
- `success_stories` indexed by: investor_id, listing_id, status, created_at
- `audit_logs` indexed by: admin_id, created_at
- `messages` indexed by: inquiry_id

---

## Data Types Reference

| Type | Usage | Example |
|------|-------|---------|
| INTEGER | IDs, counts, years | id, views, otp_attempts |
| VARCHAR(n) | Short strings | username, email, phone |
| TEXT | Long content | description, bio, message |
| TIMESTAMP | Dates/times | created_at, verified_at |
| NUMERIC(m,n) | Precise decimals | price (12,2), coordinates (10,6) |
| BOOLEAN | Flags | is_verified, is_read |
| JSON | Complex data | session data, business distribution |

---

## Document Version
- **Created**: December 21, 2025
- **Database**: PostgreSQL 18.1
- **Total Tables**: 20
- **Total Relationships**: 25+ foreign keys

