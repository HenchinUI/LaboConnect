-- Migration: Add email column to verification_requests table
-- Date: December 18, 2025
-- Purpose: Support email-based verification flow with selfie + ID photos

-- Add email column to verification_requests table
ALTER TABLE IF EXISTS verification_requests
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_email ON verification_requests(email);
