-- Add full_name column to users table
-- This migration adds the missing full_name column that the frontend expects

ALTER TABLE users ADD COLUMN full_name VARCHAR(255);

-- Update existing records to populate full_name with the name value
UPDATE users SET full_name = name;

-- Make full_name NOT NULL after populating existing records
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;

-- Create index for better performance
CREATE INDEX idx_users_full_name ON users(full_name);

-- Grant permissions (inherited from table permissions)
-- No additional grants needed as table already has proper permissions