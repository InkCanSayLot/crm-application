-- SECURE permissions - Grant minimal access to anon and full access to authenticated users only

-- Revoke all existing permissions from anon role
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Grant only SELECT permissions to anon for public data (if needed)
-- Most tables should NOT be accessible to anonymous users
GRANT SELECT ON users TO anon; -- Only for public profile viewing

-- Grant full permissions to authenticated users only
GRANT ALL PRIVILEGES ON clients TO authenticated;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON calendar_events TO authenticated;
GRANT ALL PRIVILEGES ON tasks TO authenticated;
GRANT ALL PRIVILEGES ON interactions TO authenticated;
GRANT ALL PRIVILEGES ON journal_entries TO authenticated;
GRANT ALL PRIVILEGES ON meeting_notes TO authenticated;
GRANT ALL PRIVILEGES ON ai_optimizations TO authenticated;
GRANT ALL PRIVILEGES ON chat_rooms TO authenticated;
GRANT ALL PRIVILEGES ON chat_participants TO authenticated;
GRANT ALL PRIVILEGES ON chat_messages TO authenticated;
GRANT ALL PRIVILEGES ON user_settings TO authenticated;
GRANT ALL PRIVILEGES ON file_attachments TO authenticated;
GRANT ALL PRIVILEGES ON ai_chat_sessions TO authenticated;
GRANT ALL PRIVILEGES ON ai_chat_messages TO authenticated;
GRANT ALL PRIVILEGES ON shared_tasks TO authenticated;

-- Grant sequence usage to authenticated users only
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Ensure RLS is enabled on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can view all clients" ON clients;
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Allow anon read access to tasks" ON tasks;
DROP POLICY IF EXISTS "Allow anon read access to calendar events" ON calendar_events;

-- Create secure RLS policies that check user ownership
-- Users can only access their own data
CREATE POLICY "Users can only view their own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can only update their own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = id::text);

-- Add user_id column checks for other tables (assuming they have user_id foreign keys)
-- These policies ensure users can only access their own data
CREATE POLICY "Users can only access their own clients" ON clients
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can only access their own tasks" ON tasks
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text OR assigned_to::text = auth.uid()::text);

CREATE POLICY "Users can only access their own calendar events" ON calendar_events
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can only access their own interactions" ON interactions
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can only access their own journal entries" ON journal_entries
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can only access their own meeting notes" ON meeting_notes
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can only access their own AI optimizations" ON ai_optimizations
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can only access their own user settings" ON user_settings
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can only access their own file attachments" ON file_attachments
  FOR ALL TO authenticated
  USING (uploaded_by::text = auth.uid()::text);

CREATE POLICY "Users can only access their own AI chat sessions" ON ai_chat_sessions
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can access AI chat messages from their sessions" ON ai_chat_messages
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ai_chat_sessions 
    WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
    AND ai_chat_sessions.user_id::text = auth.uid()::text
  ));

-- Chat room policies (users can only access rooms they participate in)
CREATE POLICY "Users can access chat rooms they participate in" ON chat_rooms
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.room_id = chat_rooms.id 
    AND chat_participants.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can access chat participants for their rooms" ON chat_participants
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text OR EXISTS (
    SELECT 1 FROM chat_participants cp2 
    WHERE cp2.room_id = chat_participants.room_id 
    AND cp2.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can access messages from their chat rooms" ON chat_messages
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chat_participants 
    WHERE chat_participants.room_id = chat_messages.room_id 
    AND chat_participants.user_id::text = auth.uid()::text
  ));

CREATE POLICY "Users can access shared tasks assigned to them" ON shared_tasks
  FOR ALL TO authenticated
  USING (assigned_to::text = auth.uid()::text OR created_by::text = auth.uid()::text);

-- Add input validation and sanitization comments
-- TODO: Implement input validation in application layer for:
-- - Email format validation
-- - Password strength requirements
-- - SQL injection prevention (use parameterized queries)
-- - XSS prevention (sanitize user inputs)
-- - File upload validation (type, size, content)
-- - Rate limiting on API endpoints