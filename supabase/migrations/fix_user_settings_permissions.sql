-- Check and grant permissions for user_settings table

-- Grant permissions to anon role for basic read access
GRANT SELECT ON user_settings TO anon;

-- Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON user_settings TO authenticated;

-- Check current permissions (for verification)
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND table_name = 'user_settings' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;