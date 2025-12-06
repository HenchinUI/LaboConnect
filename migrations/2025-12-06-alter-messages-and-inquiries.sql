-- Ensure inquiries has sender_user_id
ALTER TABLE inquiries
  ADD COLUMN IF NOT EXISTS sender_user_id INTEGER;

-- Ensure messages table exists with attachment and deleted columns
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  inquiry_id INTEGER NOT NULL,
  sender_user_id INTEGER,
  sender_name TEXT,
  sender_email TEXT,
  body TEXT,
  attachment_stored TEXT,
  attachment_original TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add columns if table existed prior to this migration
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_stored TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachment_original TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;

-- Index to speed up lookup
CREATE INDEX IF NOT EXISTS idx_messages_inquiry_id ON messages (inquiry_id);
