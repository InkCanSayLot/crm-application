-- Fix chat permissions for anon and authenticated roles
-- This addresses the "Access denied" errors in live chat functionality

-- Grant permissions for users table
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Grant permissions for chat_rooms table
GRANT SELECT ON chat_rooms TO anon;
GRANT ALL PRIVILEGES ON chat_rooms TO authenticated;

-- Grant permissions for chat_messages table
GRANT SELECT ON chat_messages TO anon;
GRANT ALL PRIVILEGES ON chat_messages TO authenticated;

-- Grant permissions for chat_participants table
GRANT SELECT ON chat_participants TO anon;
GRANT ALL PRIVILEGES ON chat_participants TO authenticated;

-- Verify permissions are set correctly
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name IN ('chat_rooms', 'chat_messages', 'chat_participants', 'users') 
    AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee;