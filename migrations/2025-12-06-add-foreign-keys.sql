-- Migration: Add foreign key constraints (safe, conditional)
-- Adds constraints NOT VALID, then attempts to validate each constraint.
-- This file is safe to run multiple times; it checks for existing constraint names first.

BEGIN;

-- 1) listings.owner_id -> users.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_listings_owner_id_users') THEN
    ALTER TABLE listings
      ADD CONSTRAINT fk_listings_owner_id_users FOREIGN KEY (owner_id) REFERENCES users(id) NOT VALID;
    -- try to validate; will NOT fail the migration if validation fails
    BEGIN
      ALTER TABLE listings VALIDATE CONSTRAINT fk_listings_owner_id_users;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Constraint fk_listings_owner_id_users added but NOT VALID due to: %', SQLERRM;
    END;
  END IF;
END$$;

-- 2) inquiries.owner_id -> users.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inquiries_owner_id_users') THEN
    ALTER TABLE inquiries
      ADD CONSTRAINT fk_inquiries_owner_id_users FOREIGN KEY (owner_id) REFERENCES users(id) NOT VALID;
    BEGIN
      ALTER TABLE inquiries VALIDATE CONSTRAINT fk_inquiries_owner_id_users;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Constraint fk_inquiries_owner_id_users added but NOT VALID due to: %', SQLERRM;
    END;
  END IF;
END$$;

-- 3) inquiries.listing_id -> listings.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_inquiries_listing_id_listings') THEN
    ALTER TABLE inquiries
      ADD CONSTRAINT fk_inquiries_listing_id_listings FOREIGN KEY (listing_id) REFERENCES listings(id) NOT VALID;
    BEGIN
      ALTER TABLE inquiries VALIDATE CONSTRAINT fk_inquiries_listing_id_listings;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Constraint fk_inquiries_listing_id_listings added but NOT VALID due to: %', SQLERRM;
    END;
  END IF;
END$$;

-- 4) uploads_meta.listing_id -> listings.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_uploads_meta_listing_id_listings') THEN
    ALTER TABLE uploads_meta
      ADD CONSTRAINT fk_uploads_meta_listing_id_listings FOREIGN KEY (listing_id) REFERENCES listings(id) NOT VALID;
    BEGIN
      ALTER TABLE uploads_meta VALIDATE CONSTRAINT fk_uploads_meta_listing_id_listings;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Constraint fk_uploads_meta_listing_id_listings added but NOT VALID due to: %', SQLERRM;
    END;
  END IF;
END$$;

-- 5) user_listings.user_id -> users.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_listings_user_id_users') THEN
    ALTER TABLE user_listings
      ADD CONSTRAINT fk_user_listings_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) NOT VALID;
    BEGIN
      ALTER TABLE user_listings VALIDATE CONSTRAINT fk_user_listings_user_id_users;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Constraint fk_user_listings_user_id_users added but NOT VALID due to: %', SQLERRM;
    END;
  END IF;
END$$;

-- 6) user_listings.listing_id -> listings.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_user_listings_listing_id_listings') THEN
    ALTER TABLE user_listings
      ADD CONSTRAINT fk_user_listings_listing_id_listings FOREIGN KEY (listing_id) REFERENCES listings(id) NOT VALID;
    BEGIN
      ALTER TABLE user_listings VALIDATE CONSTRAINT fk_user_listings_listing_id_listings;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Constraint fk_user_listings_listing_id_listings added but NOT VALID due to: %', SQLERRM;
    END;
  END IF;
END$$;

-- 7) notification_preferences.user_id -> users.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_notification_prefs_user_id_users') THEN
    ALTER TABLE notification_preferences
      ADD CONSTRAINT fk_notification_prefs_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) NOT VALID;
    BEGIN
      ALTER TABLE notification_preferences VALIDATE CONSTRAINT fk_notification_prefs_user_id_users;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Constraint fk_notification_prefs_user_id_users added but NOT VALID due to: %', SQLERRM;
    END;
  END IF;
END$$;

-- 8) email_logs.user_id -> users.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_email_logs_user_id_users') THEN
    ALTER TABLE email_logs
      ADD CONSTRAINT fk_email_logs_user_id_users FOREIGN KEY (user_id) REFERENCES users(id) NOT VALID;
    BEGIN
      ALTER TABLE email_logs VALIDATE CONSTRAINT fk_email_logs_user_id_users;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Constraint fk_email_logs_user_id_users added but NOT VALID due to: %', SQLERRM;
    END;
  END IF;
END$$;

-- 9) email_logs.inquiry_id -> inquiries.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_email_logs_inquiry_id_inquiries') THEN
    ALTER TABLE email_logs
      ADD CONSTRAINT fk_email_logs_inquiry_id_inquiries FOREIGN KEY (inquiry_id) REFERENCES inquiries(id) NOT VALID;
    BEGIN
      ALTER TABLE email_logs VALIDATE CONSTRAINT fk_email_logs_inquiry_id_inquiries;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Constraint fk_email_logs_inquiry_id_inquiries added but NOT VALID due to: %', SQLERRM;
    END;
  END IF;
END$$;

COMMIT;

-- NOTES:
-- If a constraint is added but not validated, you will see NOTICE messages indicating the reason.
-- To fully enforce a constraint after cleaning up orphan rows, run:
--   ALTER TABLE <table> VALIDATE CONSTRAINT <constraint_name>;
-- Example:
--   ALTER TABLE inquiries VALIDATE CONSTRAINT fk_inquiries_listing_id_listings;

-- To discover orphan rows that block a validation, use queries like:
--   SELECT i.* FROM inquiries i LEFT JOIN listings l ON i.listing_id = l.id WHERE i.listing_id IS NOT NULL AND l.id IS NULL LIMIT 50;
--   SELECT u.* FROM uploads_meta u LEFT JOIN listings l ON u.listing_id = l.id WHERE u.listing_id IS NOT NULL AND l.id IS NULL LIMIT 50;

-- After cleaning up orphan rows, re-run the VALIDATE CONSTRAINT command for the specific constraint(s).
