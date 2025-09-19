-- Fix permissions for all tables used by the CRM application

-- Grant permissions for users table
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Grant permissions for user_settings table
GRANT SELECT ON user_settings TO anon;
GRANT ALL PRIVILEGES ON user_settings TO authenticated;

-- Grant permissions for clients table
GRANT SELECT ON clients TO anon;
GRANT ALL PRIVILEGES ON clients TO authenticated;

-- Grant permissions for tasks table
GRANT SELECT ON tasks TO anon;
GRANT ALL PRIVILEGES ON tasks TO authenticated;

-- Grant permissions for calendar_events table
GRANT SELECT ON calendar_events TO anon;
GRANT ALL PRIVILEGES ON calendar_events TO authenticated;

-- Grant permissions for interactions table
GRANT SELECT ON interactions TO anon;
GRANT ALL PRIVILEGES ON interactions TO authenticated;

-- Grant permissions for journal_entries table
GRANT SELECT ON journal_entries TO anon;
GRANT ALL PRIVILEGES ON journal_entries TO authenticated;

-- Grant permissions for meeting_notes table
GRANT SELECT ON meeting_notes TO anon;
GRANT ALL PRIVILEGES ON meeting_notes TO authenticated;

-- Grant permissions for ai_optimizations table
GRANT SELECT ON ai_optimizations TO anon;
GRANT ALL PRIVILEGES ON ai_optimizations TO authenticated;

-- Grant permissions for chat_rooms table
GRANT SELECT ON chat_rooms TO anon;
GRANT ALL PRIVILEGES ON chat_rooms TO authenticated;

-- Grant permissions for chat_participants table
GRANT SELECT ON chat_participants TO anon;
GRANT ALL PRIVILEGES ON chat_participants TO authenticated;

-- Grant permissions for chat_messages table
GRANT SELECT ON chat_messages TO anon;
GRANT ALL PRIVILEGES ON chat_messages TO authenticated;

-- Verify permissions are set correctly
SELECT grantee, table_name, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
  AND grantee IN ('anon', 'authenticated') 
ORDER BY table_name, grantee