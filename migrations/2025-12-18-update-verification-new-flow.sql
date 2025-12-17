-- Update verification_requests table to support new verification flow
-- Adds selfie photo URL column and updates status values

-- Add selfie_photo_url column if it doesn't exist
ALTER TABLE IF EXISTS verification_requests 
ADD COLUMN IF NOT EXISTS selfie_photo_url VARCHAR(500);

-- Update the status enum/check constraint to include 'pending_admin_review'
-- Note: PostgreSQL doesn't allow easy modification of enum types, so we'll use a VARCHAR
-- If status column exists and is ENUM, you may need to migrate it manually

-- Create an index on the new column
CREATE INDEX IF NOT EXISTS idx_verification_selfie_photo ON verification_requests(selfie_photo_url);

-- Add updated_at column if missing
ALTER TABLE IF EXISTS verification_requests
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Update comment to reflect new flow
COMMENT ON TABLE verification_requests IS 'Stores user verification requests with documents (selfie + ID) and OTP email verification';
