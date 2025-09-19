-- Create Supabase Auth users for the 3 existing users
-- Note: This requires using Supabase Auth Admin API or manual creation
-- For now, let's create a simple auth bypass for development

-- First, let's check if we can create auth users directly
-- This might not work as it requires admin privileges

-- Alternative approach: Modify the application to work without Supabase Auth
-- or create a simple session-based auth

-- For now, let's create some test auth entries if possible
-- Insert auth.users entries (this may not work due to RLS)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'william@emptyad.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'beck@emptyad.com', crypt('password123', gen_salt('bf')), now(), now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'roman@emptyad.com', crypt('password123', gen_salt('bf')), now(), now(), now())
ON CONFLICT (email) DO NOTHING;

-- Update the users table to match the auth user IDs
UPDATE users SET id = '11111111-1111-1111-1111-111111111111' WHERE email = 'william@emptyad.com';
UPDATE users SET id = '22222222-2222-2222-2222-222222222222' WHERE email = 'beck@emptyad.com';
UPDATE users SET id = '33333333-3333-3333-3333-333333333333' WHERE email = 'roman@emptyad.com';

-- Create corresponding user_settings entries
INSERT INTO user_settings (user_id, timezone, currency, date_format, time_format)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'America/New_York', 'USD', 'MM/dd/yyyy', '12h'),
  ('22222222-2222-2222-2222-222222222222', 'America/New_York', 'USD', 'MM/dd/yyyy', '12h'),
  ('33333333-3333-3333-3333-333333333333', 'America/New_York', 'USD', 'MM/dd/yyyy', '12h')
ON CONFLICT (user_id) DO UPDATE SET
  timezone = EXCLUDED.timezone,
  currency = EXCLUDED.currency,
  date_format = EXCLUDED.date_format,
  time_format = EXCLUDED.time_format;