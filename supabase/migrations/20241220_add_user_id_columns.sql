-- Add user_id columns to tables that don't have them
-- This migration ensures all tables have proper user isolation

-- Add user_id to clients table (if not exists)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add user_id to ai_optimizations table (if not exists)
ALTER TABLE ai_optimizations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add user_id to chat_rooms table (if not exists)
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add user_id to chat_messages table (if not exists)
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add user_id to task_group_members table (if not exists)
ALTER TABLE task_group_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add user_id to shared_tasks table (if not exists)
ALTER TABLE shared_tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add user_id to task_groups table (if not exists)
ALTER TABLE task_groups ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Add user_id to chat_participants table (if not exists)
ALTER TABLE chat_participants ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES users(id);

-- Add user_id to file_attachments table (if not exists)
ALTER TABLE file_attachments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);

-- Update RLS policies to use user_id for proper isolation

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only see their own clients" ON clients;
DROP POLICY IF EXISTS "Users can only insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can only update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can only delete their own clients" ON clients;

-- Create new RLS policies for clients
CREATE POLICY "Users can only see their own clients" ON clients
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can only insert their own clients" ON clients
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only update their own clients" ON clients
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can only delete their own clients" ON clients
    FOR DELETE USING (user_id = auth.uid());

-- Update RLS policies for interactions
DROP POLICY IF EXISTS "Users can only see their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can only insert their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can only update their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can only delete their own interactions" ON interactions;

CREATE POLICY "Users can only see their own interactions" ON interactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can only insert their own interactions" ON interactions
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only update their own interactions" ON interactions
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can only delete their own interactions" ON interactions
    FOR DELETE USING (user_id = auth.uid());

-- Update RLS policies for tasks
DROP POLICY IF EXISTS "Users can only see their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can only insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can only update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can only delete their own tasks" ON tasks;

CREATE POLICY "Users can only see their own tasks" ON tasks
    FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Users can only insert their own tasks" ON tasks
    FOR INSERT WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Users can only update their own tasks" ON tasks
    FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "Users can only delete their own tasks" ON tasks
    FOR DELETE USING (assigned_to = auth.uid());

-- Update RLS policies for calendar_events (already has user_id)
DROP POLICY IF EXISTS "Users can only see their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can only insert their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can only update their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can only delete their own calendar events" ON calendar_events;

CREATE POLICY "Users can only see their own calendar events" ON calendar_events
    FOR SELECT USING (user_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can only insert their own calendar events" ON calendar_events
    FOR INSERT WITH CHECK (user_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can only update their own calendar events" ON calendar_events
    FOR UPDATE USING (user_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "Users can only delete their own calendar events" ON calendar_events
    FOR DELETE USING (user_id = auth.uid() OR created_by = auth.uid());

-- Update RLS policies for journal_entries (already has user_id)
DROP POLICY IF EXISTS "Users can only see their own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can only insert their own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can only update their own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can only delete their own journal entries" ON journal_entries;

CREATE POLICY "Users can only see their own journal entries" ON journal_entries
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can only insert their own journal entries" ON journal_entries
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only update their own journal entries" ON journal_entries
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can only delete their own journal entries" ON journal_entries
    FOR DELETE USING (user_id = auth.uid());

-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON clients TO authenticated;
GRANT ALL PRIVILEGES ON interactions TO authenticated;
GRANT ALL PRIVILEGES ON tasks TO authenticated;
GRANT ALL PRIVILEGES ON calendar_events TO authenticated;
GRANT ALL PRIVILEGES ON journal_entries TO authenticated;
GRANT ALL PRIVILEGES ON ai_optimizations TO authenticated;
GRANT ALL PRIVILEGES ON chat_rooms TO authenticated;
GRANT ALL PRIVILEGES ON chat_messages TO authenticated;
GRANT ALL PRIVILEGES ON task_group_members TO authenticated;
GRANT ALL PRIVILEGES ON shared_tasks TO authenticated;
GRANT ALL PRIVILEGES ON task_groups TO authenticated;
GRANT ALL PRIVILEGES ON chat_participants TO authenticated;
GRANT ALL PRIVILEGES ON file_attachments TO authenticated;
GRANT ALL PRIVILEGES ON meeting_notes TO authenticated;
GRANT ALL PRIVILEGES ON ai_chat_sessions TO authenticated;
GRANT ALL PRIVILEGES ON ai_chat_messages TO authenticated;
GRANT ALL PRIVILEGES ON user_settings TO authenticated;

-- Grant basic read access to anon role for public data
GRANT SELECT ON users TO anon;