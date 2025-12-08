-- Migration: create support tables and ensure listing columns
-- Run with: node scripts/run_migrations.js

-- Create uploads_meta if missing
CREATE TABLE IF NOT EXISTS uploads_meta (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER,
  field_name TEXT,
  stored_filename TEXT,
  original_filename TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_listings if missing
CREATE TABLE IF NOT EXISTS user_listings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  listing_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

-- Ensure 'approved' and 'status' columns exist on listings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='approved') THEN
    ALTER TABLE listings ADD COLUMN approved BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='status') THEN
    ALTER TABLE listings ADD COLUMN status TEXT DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='created_at') THEN
    ALTER TABLE listings ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='listings' AND column_name='updated_at') THEN
    ALTER TABLE listings ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();
  END IF;
END$$;

-- Add simple indexes to speed status lookups
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);
