-- Fix users table column length constraints for profile functionality
-- The current varchar(20) constraints are too restrictive for real-world usage

-- Increase column lengths to accommodate realistic profile data
ALTER TABLE users 
  ALTER COLUMN name TYPE varchar(100),
  ALTER COLUMN phone TYPE varchar(30),
  ALTER COLUMN location TYPE varchar(200),
  ALTER COLUMN company TYPE varchar(100);

-- Add comment to document the change
COMMENT ON TABLE users IS 'User profiles with authentication integration - updated column constraints for better UX';