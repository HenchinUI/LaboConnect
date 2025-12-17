-- Migration: Restructure verification_requests table for email-based verification
-- Date: December 18, 2025
-- Purpose: Update verification_requests table to support email-based verification with selfie + ID photos

-- Make phone_number nullable since we're using email now
ALTER TABLE IF EXISTS verification_requests
ALTER COLUMN phone_number DROP NOT NULL;

-- Ensure all necessary columns exist
ALTER TABLE IF EXISTS verification_requests
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS selfie_photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS id_document_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_verification_email ON verification_requests(email);
CREATE INDEX IF NOT EXISTS idx_verification_selfie ON verification_requests(selfie_photo_url);
CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_requests(status);
