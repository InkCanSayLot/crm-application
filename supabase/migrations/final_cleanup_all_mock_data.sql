-- Final cleanup: Remove ALL mock data and fix user emails
-- Keep only the 3 real users with correct emails and no other data

-- Delete all sample data from all tables (order matters due to foreign key constraints)
DELETE FROM ai_optimizations;
DELETE FROM meeting_notes;
DELETE FROM calendar_events;
DELETE FROM interactions;
DELETE FROM tasks;
DELETE FROM journal_entries;
DELETE FROM clients;
DELETE FROM user_settings;

-- Fix user emails and ensure only the 3 real users exist
DELETE FROM users;

-- Insert the 3 real users with correct emails
INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'william@emptyad.com', 'William Walsh', 'CEO', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'beck@emptyad.com', 'Beck Majdell', 'CGO', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'roman@emptyad.com', 'M.A. Roman', 'CTO', NOW(), NOW());

-- Verify the cleanup
SELECT 'Users count:' as info, COUNT(*) as count FROM users;
SELECT 'Clients count:' as info, COUNT(*) as count FROM clients;
SELECT 'Tasks count:' as info, COUNT(*) as count FROM tasks;
SELECT 'Calendar events count:' as info, COUNT(*) as count FROM calendar_events;
SELECT 'Journal entries count:' as info, COUNT(*) as count FROM journal_entries;
SELECT 'User settings count:' as info, COUNT(*) as count FROM user_settings;

-- Show the final users
SELECT id, email, name, role FROM users ORDER BY email;