-- Remove all mock data except the 3 specified users
-- Keep only william, beck, and roman users

-- Delete all sample clients
DELETE FROM clients WHERE company_name IN ('TechCorp Solutions', 'Digital Innovations', 'StartupXYZ');

-- Delete all sample tasks
DELETE FROM tasks WHERE title IN (
    'Follow up with TechCorp', 
    'Prepare demo for Digital Innovations', 
    'Schedule meeting with StartupXYZ'
);

-- Delete all sample calendar events
DELETE FROM calendar_events WHERE title IN (
    'Daily Sync Meeting', 
    'Client Demo - Digital Innovations'
);

-- Delete any sample interactions
DELETE FROM interactions WHERE content IS NOT NULL;

-- Delete any sample journal entries
DELETE FROM journal_entries WHERE sales_accomplishment IS NOT NULL OR marketing_accomplishment IS NOT NULL;

-- Delete any sample meeting notes
DELETE FROM meeting_notes WHERE raw_notes IS NOT NULL;

-- Delete any sample AI optimizations
DELETE FROM ai_optimizations WHERE original_message IS NOT NULL;

-- Ensure we only have the 3 specified users with correct data
DELETE FROM users WHERE email NOT IN ('william@emptyad.com', 'beck@emptyad.com', 'roman@emptyad.com');

-- Update user data to match the specified names and roles
UPDATE users SET 
    name = 'William Walsh',
    role = 'CEO'
WHERE email = 'william@emptyad.com';

UPDATE users SET 
    name = 'Beck Majdell',
    role = 'CGO'
WHERE email = 'beck@emptyad.com';

UPDATE users SET 
    name = 'M.A. Roman',
    role = 'CTO'
WHERE email = 'roman