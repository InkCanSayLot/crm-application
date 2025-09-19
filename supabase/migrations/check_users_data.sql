-- Check what users exist in the database
SELECT id, email, name, role, created_at FROM users ORDER BY created_at;

-- Check user_settings data
SELECT * FROM user_settings;

-- Check if there are any RLS policies that might be blocking access
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'user_settings')
ORDER BY tablename, policyname;