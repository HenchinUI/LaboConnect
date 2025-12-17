-- Create migration_log table if it doesn't exist
CREATE TABLE IF NOT EXISTS migration_log (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  executed_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'completed'
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_migration_log_name ON migration_log(name);
