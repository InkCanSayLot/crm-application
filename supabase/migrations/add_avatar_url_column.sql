-- Add avatar_url column to users table
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Grant permissions to anon and authenticated roles
GRANT SELECT, UPDATE ON users TO anon;
GRANT SELECT, UPDATE ON users TO authenticated;