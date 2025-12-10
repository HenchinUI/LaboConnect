-- Migration: Change listings table from separate first/last name to single owner_name
-- Date: 2025-12-11

-- Check if the columns exist before dropping
DO $$
BEGIN
    -- Add owner_name column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' AND column_name = 'owner_name'
    ) THEN
        ALTER TABLE listings ADD COLUMN owner_name VARCHAR(255);
    END IF;

    -- Copy data from first_name and last_name to owner_name if columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' AND column_name = 'owner_first_name'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'listings' AND column_name = 'owner_last_name'
    ) THEN
        UPDATE listings 
        SET owner_name = TRIM(CONCAT(owner_first_name, ' ', owner_last_name))
        WHERE owner_name IS NULL;
    END IF;
END $$;
