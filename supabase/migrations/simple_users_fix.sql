-- Simple fix for users table - just ensure the right users exist with right IDs
-- Delete all existing users and recreate them
DELETE FROM users;

-- Insert the 3 demo users with specific IDs
INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'william@emptyad.com', 'William', 'CEO', now(), now()),
('22222222-2222-2222-2222-222222222222', 'beck@emptyad.com', 'Beck', 'CGO', now(), now()),
('33333333-3333-3333-3333-333333333333', 'roman@emptyad.com', 'Roman', 'Admin', now(), now());

-- Verify the users
SELECT id, email, name, role FROM users ORDER