-- Add avatar_url column to users table
ALTER TABLE users ADD COLUMN avatar_url TEXT;

-- Grant permissions to anon and authenticated roles
GRANT SELECT, UPDATE ON users TO anon;
GRANT SELECT, UPDATE ON users TO authenticated;

-- Update existing users to use profile_image_url as avatar_url if needed
UPDATE users SET avatar_url = profile_image_url WHERE profile_image_url IS NOT NULL;