-- Ensure all 3 demo users exist in the database with correct data
-- This fixes the issue where team page only shows one user

-- Delete existing users to avoid conflicts
DELETE FROM users;

-- Insert all 3 demo users with correct data
INSERT INTO users (id, email, name, full_name, role, is_online, last_seen, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'william@emptyad.com', 'William Walsh', 'William Walsh', 'CEO', false, now(), now(), now()),
('22222222-2222-2222-2222-222222222222', 'beck@emptyad.com', 'Beck Majdell', 'Beck Majdell', 'CGO', false, now(), now(), now()),
('33333333-3333-3333-3333-333333333333', 'roman@emptyad.com', 'M.A. Roman', 'M.A. Roman', 'CTO', false, now(), now(), now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  updated_at = now();

-- Verify the users were created
SELECT id, email, name, full_name, role, is_online, last_seen FROM users ORDER BY email;