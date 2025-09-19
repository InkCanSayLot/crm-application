-- Fix user data to include proper full_name values
-- Update existing users with correct full names

UPDATE users SET full_name = 'William Walsh' WHERE email = 'william@emptyad.com';
UPDATE users SET full_name = 'Beck Majdell' WHERE email = 'beck@emptyad.com';
UPDATE users SET full_name = 'M.A. Roman' WHERE email = 'roman@emptyad.com';

-- Verify the updates
SELECT id, email, name, full_name, role FROM users ORDER BY email;