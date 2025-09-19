-- Update user emails from @emptyoperations.com to @emptyad.com
-- Ensure users have correct @emptyad.com email addresses

-- Delete any users with @emptyoperations.com emails first
DELETE FROM users WHERE email LIKE '%@emptyoperations.com';

-- Upsert users with correct @emptyad.com emails
INSERT INTO users (email, name, role) VALUES
('william@emptyad.com', 'William', 'CEO'),
('beck@emptyad.com', 'Beck', 'CGO'),
('roman@emptyad.com', 'Roman', 'CTO')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  updated_at = now();

-- Grant permissions for the users table
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;
GRANT SELECT ON users TO anon;