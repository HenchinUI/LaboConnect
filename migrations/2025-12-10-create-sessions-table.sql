-- Create sessions table for connect-pg-simple
-- This stores user sessions in PostgreSQL instead of memory

CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL,
  PRIMARY KEY ("sid")
)
WITH (OIDS=FALSE);

-- Create index on expire column for automatic cleanup of expired sessions
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");
