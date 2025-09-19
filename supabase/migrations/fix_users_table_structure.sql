-- Fix the users table structure and create proper user entries
-- Update existing users with proper UUIDs

-- Update existing users with consistent UUIDs
UPDATE users SET id = '11111111-1111-1111-1111-111111111111' WHERE email = 'william@emptyad.com';
UPDATE users SET id = '22222222-2222-2222-2222-222222222222' WHERE email = 'beck@emptyad.com';
UPDATE users SET id = '33333333-3333-3333-3333-333333333333' WHERE email = 'roman@emptyad.com';

-- Ensure user_settings exist for these users
INSERT INTO user_settings (user_id, timezone, currency, date_format, time_format)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'America/New_York', 'USD', 'MM/dd/yyyy', '12h'),
  ('22222222-2222-2222-2222-222222222222', 'America/New_York', 'USD', 'MM/dd/yyyy', '12h'),
  ('33333333-3333-3333-3333-333333333333', 'America/New_York', 'USD', 'MM/dd/yyyy', '12h')
ON CONFLICT (user_id) DO UPDATE SET
  timezone = EXCLUDED.timezone,
  currency = EXCLUDED.currency,
  date_format = EXCLUDED.date_format,
  time_format = EXCLUDED.time_format,
  updated_at = now();

-- Add password field to users table for simple auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Set simple passwords for demo users
UPDATE users SET password_hash = 'demo_password_hash' WHERE email IN ('william@emptyad.com', 'beck@emptyad.com', 'roman@emptyad.com');