-- Migration: Add Email Verification Columns
-- Date: December 17, 2025
-- Purpose: Add email verification support to users table

-- Add email verification columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6),
ADD COLUMN IF NOT EXISTS verification_code_expiry TIMESTAMP;

-- Create index for faster verification code lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(verification_code) WHERE verification_code IS NOT NULL;

-- Log the migration
INSERT INTO migration_log (name, executed_at, status) 
VALUES ('add_email_verification_columns', NOW(), 'completed')
ON CONFLICT (name) DO NOTHING;
