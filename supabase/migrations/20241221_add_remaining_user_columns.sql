-- Add remaining missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS company VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Update existing users with NULL values to empty string if needed
UPDATE users SET location = '' WHERE location IS NULL;
UPDATE users SET company = '' WHERE company IS NULL;
UPDATE users SET bio = '' WHERE bio IS NULL;

-- Grant permissions for the new columns
GRANT SELECT, INSERT, UPDATE ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Add comments for tracking
COMMENT ON COLUMN users.location IS 'User location - added to fix production schema issues';
COMMENT ON COLUMN users.company IS 'User company - added to fix production schema issues';
COMMENT ON COLUMN users.bio IS 'User bio - added to fix production schema issues';

-- Ensure RLS policies are still in place
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Refresh permissions
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;