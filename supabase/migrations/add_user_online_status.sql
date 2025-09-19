-- Add online status tracking columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create index for better performance on online status queries
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users(is_online);
CREATE INDEX IF NOT EXISTS idx_users_last_seen ON users(last_seen);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, UPDATE ON users TO anon;
GRANT SELECT, UPDATE ON users TO authenticated;

-- Update existing users to have proper online status
UPDATE users SET 
  is_online = false,
  last_seen = updated_at
WHERE is_online IS NULL OR last_seen IS NULL