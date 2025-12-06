-- Migration: Create inquiries and related support tables (safe, idempotent)
-- Run this in your PostgreSQL database (psql, pgAdmin, etc.)

BEGIN;

-- 1) Create inquiries table if it doesn't exist (includes owner_id and is_read)
CREATE TABLE IF NOT EXISTS inquiries (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER,
  first_name TEXT,
  last_name TEXT,
  contact_number TEXT,
  email TEXT,
  company TEXT,
  message TEXT,
  owner_id INTEGER,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2) uploads_meta for original filename mapping
CREATE TABLE IF NOT EXISTS uploads_meta (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER,
  field_name TEXT,
  stored_filename TEXT,
  original_filename TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3) Ensure listings table has owner_id (no foreign key to avoid migration errors)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS owner_id INTEGER;

-- 4) Link table for user -> listing (helps if you want a dedicated mapping)
CREATE TABLE IF NOT EXISTS user_listings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- 5) Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL,
  email_new_inquiry BOOLEAN DEFAULT TRUE,
  email_digest BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 6) Email logs table to track sends
CREATE TABLE IF NOT EXISTS email_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  inquiry_id INTEGER,
  email_address TEXT,
  subject TEXT,
  status TEXT DEFAULT 'pending', -- pending, sent, failed, logged
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMIT;

-- Notes:
-- - This migration is idempotent and safe to run multiple times.
-- - I intentionally avoided adding FOREIGN KEY constraints here to keep the migration simple
--   and avoid errors if `users` or `listings` tables are missing or structured differently.
-- - Once you confirm the shapes of `users` and `listings`, we can add FKs in a follow-up migration.
