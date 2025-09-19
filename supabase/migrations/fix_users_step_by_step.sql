-- Step-by-step fix for users and user_settings

-- Step 1: Delete existing user_settings to avoid foreign key conflicts
DELETE FROM user_settings;

-- Step 2: Update users table with consistent UUIDs
UPDATE users SET id = '11111111-1111-1111-1111-111111111111' WHERE email = 'william@emptyad.com';
UPDATE users SET id = '22222222-2222-2222-2222-222222222222' WHERE email = 'beck@emptyad.com';
UPDATE users SET id = '33333333-3333-3333-3333-333333333333' WHERE email = 'roman@emptyad.com';

-- Step 3: Add password field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Step 4: Set simple passwords for demo users
UPDATE users SET password_hash = 'demo_password_hash' WHERE email IN ('william@emptyad.com', 'beck@emptyad.com', 'roman@emptyad.com');

-- Step 5: Create user_settings for these users
INSERT INTO user_settings (user_id, timezone, currency, date_format, time_format)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'America/New_York', 'USD', 'MM/dd/yyyy', '12h'),
  ('22222222-2222-2222-2222-222222222222', 'America/New_York', 'USD', 'MM/dd/yyyy', '12h'),
  ('33333333-3333-3333-3333-333333333333', 'America/New_York', 'USD', 'MM/dd/yyyy', '12h');

-- Step 6: Verify the results
SELECT 'Users:' as table_name, id, email, name FROM users
UNION ALL
SELECT 'Settings:' as table_name, user_id, timezone, currency FROM user_settings;