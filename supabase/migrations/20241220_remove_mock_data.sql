-- Remove all mock data from all tables
-- This will clean the database completely

-- Delete all data from tables (order matters due to foreign key constraints)
DELETE FROM calendar_events;
DELETE FROM chat_messages;
DELETE FROM chat_participants;
DELETE FROM chat_rooms;
DELETE FROM meeting_notes;
DELETE FROM ai_optimizations;
DELETE FROM interactions;
DELETE FROM tasks;
DELETE FROM journal_entries;
DELETE FROM clients;
DELETE FROM user_settings;
DELETE FROM users;

-- Insert the 3 specified users with valid roles (CEO, CGO, CTO)
INSERT INTO users (id, email, name, role, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'william@emptyad.com', 'William Walsh', 'CEO', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'beck@emptyad.com', 'Beck', 'CGO', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'roman@emptyad.com', 'Roman', 'CTO', NOW(), NOW());

-- Note: user_settings will be created by the application when users log in
-- since it references auth.users table, not public.users