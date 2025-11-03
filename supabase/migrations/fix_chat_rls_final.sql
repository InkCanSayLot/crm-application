-- Final fix for chat RLS policies and permissions
-- This migration ensures proper permissions for chat functionality

-- First, grant basic table permissions to roles
GRANT ALL PRIVILEGES ON chat_rooms TO authenticated;
GRANT ALL PRIVILEGES ON chat_participants TO authenticated;
GRANT ALL PRIVILEGES ON chat_messages TO authenticated;

GRANT ALL PRIVILEGES ON chat_rooms TO anon;
GRANT ALL PRIVILEGES ON chat_participants TO anon;
GRANT ALL PRIVILEGES ON chat_messages TO anon;

-- Drop ALL existing policies to start fresh
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on chat_rooms
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'chat_rooms') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON chat_rooms';
    END LOOP;
    
    -- Drop all policies on chat_participants
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'chat_participants') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON chat_participants';
    END LOOP;
    
    -- Drop all policies on chat_messages
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'chat_messages') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON chat_messages';
    END LOOP;
END $$;

-- Create simple, permissive policies for demo purposes
-- These allow both authenticated and anon users full access

-- Chat rooms policies
CREATE POLICY "chat_rooms_all_access" ON chat_rooms
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Chat participants policies
CREATE POLICY "chat_participants_all_access" ON chat_participants
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Chat messages policies
CREATE POLICY "chat_messages_all_access" ON chat_messages
  FOR ALL TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Ensure RLS is enabled but not forced
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Also ensure users table has proper permissions
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON users TO anon;

-- Check current permissions
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND grantee IN ('anon', 'authenticated') 
AND table_name IN ('chat_rooms', 'chat_participants', 'chat_messages', 'users')
ORDER BY table_name, grantee;