-- Data Separation Architecture Migration
-- This migration implements proper data separation between shared/global and user-specific data

-- =============================================
-- SHARED/GLOBAL DATA TABLES - RLS POLICIES
-- =============================================

-- Clients table - Shared across all users
DROP POLICY IF EXISTS "clients_policy" ON clients;
CREATE POLICY "clients_policy" ON clients
  FOR ALL USING (true)
  WITH CHECK (true);

-- Interactions table - Shared across all users
DROP POLICY IF EXISTS "interactions_policy" ON interactions;
CREATE POLICY "interactions_policy" ON interactions
  FOR ALL USING (true)
  WITH CHECK (true);

-- Tasks table - Shared across all users
DROP POLICY IF EXISTS "tasks_policy" ON tasks;
CREATE POLICY "tasks_policy" ON tasks
  FOR ALL USING (true)
  WITH CHECK (true);

-- Task Groups table - Shared across all users
DROP POLICY IF EXISTS "task_groups_policy" ON task_groups;
CREATE POLICY "task_groups_policy" ON task_groups
  FOR ALL USING (true)
  WITH CHECK (true);

-- Task Group Members table - Shared across all users
DROP POLICY IF EXISTS "task_group_members_policy" ON task_group_members;
CREATE POLICY "task_group_members_policy" ON task_group_members
  FOR ALL USING (true)
  WITH CHECK (true);

-- Shared Tasks table - Shared across all users
DROP POLICY IF EXISTS "shared_tasks_policy" ON shared_tasks;
CREATE POLICY "shared_tasks_policy" ON shared_tasks
  FOR ALL USING (true)
  WITH CHECK (true);

-- Users table - Shared across all users (team management)
DROP POLICY IF EXISTS "users_policy" ON users;
CREATE POLICY "users_policy" ON users
  FOR ALL USING (true)
  WITH CHECK (true);

-- Calendar Events - Mixed: shared events (is_collective=true) visible to all, personal events (is_collective=false) only to owner
DROP POLICY IF EXISTS "calendar_events_policy" ON calendar_events;
CREATE POLICY "calendar_events_policy" ON calendar_events
  FOR ALL USING (
    is_collective = true OR 
    (is_collective = false AND user_id = auth.uid())
  )
  WITH CHECK (
    is_collective = true OR 
    (is_collective = false AND user_id = auth.uid())
  );

-- Meeting Notes table - Shared across all users
DROP POLICY IF EXISTS "meeting_notes_policy" ON meeting_notes;
CREATE POLICY "meeting_notes_policy" ON meeting_notes
  FOR ALL USING (true)
  WITH CHECK (true);

-- AI Optimizations table - Shared across all users
DROP POLICY IF EXISTS "ai_optimizations_policy" ON ai_optimizations;
CREATE POLICY "ai_optimizations_policy" ON ai_optimizations
  FOR ALL USING (true)
  WITH CHECK (true);

-- Chat Rooms table - Shared across all users (general chat)
DROP POLICY IF EXISTS "chat_rooms_policy" ON chat_rooms;
CREATE POLICY "chat_rooms_policy" ON chat_rooms
  FOR ALL USING (true)
  WITH CHECK (true);

-- Chat Participants table - Shared across all users
DROP POLICY IF EXISTS "chat_participants_policy" ON chat_participants;
CREATE POLICY "chat_participants_policy" ON chat_participants
  FOR ALL USING (true)
  WITH CHECK (true);

-- Chat Messages table - Users can see messages in rooms they participate in
DROP POLICY IF EXISTS "chat_messages_policy" ON chat_messages;
CREATE POLICY "chat_messages_policy" ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chat_participants cp 
      WHERE cp.room_id = chat_messages.room_id 
      AND cp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_participants cp 
      WHERE cp.room_id = chat_messages.room_id 
      AND cp.user_id = auth.uid()
    )
  );

-- File Attachments table - Shared across all users
DROP POLICY IF EXISTS "file_attachments_policy" ON file_attachments;
CREATE POLICY "file_attachments_policy" ON file_attachments
  FOR ALL USING (true)
  WITH CHECK (true);

-- =============================================
-- USER-SPECIFIC/PRIVATE DATA TABLES - RLS POLICIES
-- =============================================

-- Journal Entries table - User can only see their own entries
DROP POLICY IF EXISTS "journal_entries_policy" ON journal_entries;
CREATE POLICY "journal_entries_policy" ON journal_entries
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- AI Chat Sessions table - User can only see their own sessions
DROP POLICY IF EXISTS "ai_chat_sessions_policy" ON ai_chat_sessions;
CREATE POLICY "ai_chat_sessions_policy" ON ai_chat_sessions
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- AI Chat Messages table - User can only see messages from their own sessions
DROP POLICY IF EXISTS "ai_chat_messages_policy" ON ai_chat_messages;
CREATE POLICY "ai_chat_messages_policy" ON ai_chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions acs 
      WHERE acs.id = ai_chat_messages.session_id 
      AND acs.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_chat_sessions acs 
      WHERE acs.id = ai_chat_messages.session_id 
      AND acs.user_id = auth.uid()
    )
  );

-- User Settings table - User can only see their own settings
DROP POLICY IF EXISTS "user_settings_policy" ON user_settings;
CREATE POLICY "user_settings_policy" ON user_settings
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- GRANT PERMISSIONS TO ROLES
-- =============================================

-- Grant permissions for shared/global tables
GRANT ALL PRIVILEGES ON clients TO authenticated;
GRANT ALL PRIVILEGES ON interactions TO authenticated;
GRANT ALL PRIVILEGES ON tasks TO authenticated;
GRANT ALL PRIVILEGES ON task_groups TO authenticated;
GRANT ALL PRIVILEGES ON task_group_members TO authenticated;
GRANT ALL PRIVILEGES ON shared_tasks TO authenticated;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON calendar_events TO authenticated;
GRANT ALL PRIVILEGES ON meeting_notes TO authenticated;
GRANT ALL PRIVILEGES ON ai_optimizations TO authenticated;
GRANT ALL PRIVILEGES ON chat_rooms TO authenticated;
GRANT ALL PRIVILEGES ON chat_participants TO authenticated;
GRANT ALL PRIVILEGES ON chat_messages TO authenticated;
GRANT ALL PRIVILEGES ON file_attachments TO authenticated;

-- Grant permissions for user-specific tables
GRANT ALL PRIVILEGES ON journal_entries TO authenticated;
GRANT ALL PRIVILEGES ON ai_chat_sessions TO authenticated;
GRANT ALL PRIVILEGES ON ai_chat_messages TO authenticated;
GRANT ALL PRIVILEGES ON user_settings TO authenticated;

-- Grant SELECT permissions to anon role for public data (if needed)
GRANT SELECT ON clients TO anon;
GRANT SELECT ON users TO anon;
GRANT SELECT ON tasks TO anon;
GRANT SELECT ON task_groups TO anon;
GRANT SELECT ON calendar_events TO anon;

-- =============================================
-- HELPER FUNCTIONS FOR DATA SEPARATION
-- =============================================

-- Function to check if a calendar event is shared
CREATE OR REPLACE FUNCTION is_shared_calendar_event(event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM calendar_events 
    WHERE id = event_id AND is_collective = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's personal calendar events
CREATE OR REPLACE FUNCTION get_user_personal_events(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  type VARCHAR,
  created_by UUID,
  is_collective BOOLEAN,
  created_at TIMESTAMPTZ,
  client_id UUID,
  shared_with_team BOOLEAN,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT ce.* FROM calendar_events ce
  WHERE ce.user_id = user_uuid AND ce.is_collective = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get shared calendar events
CREATE OR REPLACE FUNCTION get_shared_calendar_events()
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  description TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  type VARCHAR,
  created_by UUID,
  is_collective BOOLEAN,
  created_at TIMESTAMPTZ,
  client_id UUID,
  shared_with_team BOOLEAN,
  user_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT ce.* FROM calendar_events ce
  WHERE ce.is_collective = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Index for calendar events data separation
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_collective 
ON calendar_events(user_id, is_collective);

-- Index for AI chat sessions by user
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user_id 
ON ai_chat_sessions(user_id);

-- Index for journal entries by user
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id 
ON journal_entries(user_id);

-- Index for user settings by user
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id 
ON user_settings(user_id);

-- Index for chat participants for message access control
CREATE INDEX IF NOT EXISTS idx_chat_participants_room_user 
ON chat_participants(room_id, user_id);

-- =============================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON POLICY "clients_policy" ON clients IS 'Shared data - visible to all authenticated users';
COMMENT ON POLICY "journal_entries_policy" ON journal_entries IS 'Private data - users can only access their own entries';
COMMENT ON POLICY "calendar_events_policy" ON calendar_events IS 'Mixed data - shared events visible to all, personal events only to owner';
COMMENT ON POLICY "ai_chat_sessions_policy" ON ai_chat_sessions IS 'Private data - users can only access their own AI chat sessions';
COMMENT ON POLICY "chat_messages_policy" ON chat_messages IS 'Conditional access - users can see messages in rooms they participate in';

-- =============================================
-- VERIFICATION QUERIES (for testing)
-- =============================================

-- These queries can be used to verify the data separation is working correctly
-- Uncomment and run individually for testing

/*
-- Test shared data access (should return data for all users)
SELECT 'clients' as table_name, count(*) as total_records FROM clients;
SELECT 'tasks' as table_name, count(*) as total_records FROM tasks;
SELECT 'users' as table_name, count(*) as total_records FROM users;

-- Test user-specific data access (should only return current user's data)
SELECT 'journal_entries' as table_name, count(*) as user_records FROM journal_entries;
SELECT 'ai_chat_sessions' as table_name, count(*) as user_records FROM ai_chat_sessions;
SELECT 'user_settings' as table_name, count(*) as user_records FROM user_settings;

-- Test mixed data access (calendar events)
SELECT 'shared_calendar_events' as type, count(*) as records FROM calendar_events WHERE is_collective = true;
SELECT 'personal_calendar_events' as type, count(*) as records FROM calendar_events WHERE is_collective = false;
*/