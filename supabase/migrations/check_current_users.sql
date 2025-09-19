-- Check current users table structure and data
SELECT id, email, name, role FROM users ORDER BY email;

-- Check user_settings table
SELECT user_id, timezone, currency FROM user_settings;

-- Check table constraints
SELECT conname, contype, confrelid::regclass as foreign_table 
FROM pg_constraint 
WHERE conrelid = 'user_settings'::regclass;