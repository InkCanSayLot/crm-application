-- Update RLS policies for 3-user team with shared/private data separation
-- Drop ALL existing policies first to avoid conflicts

-- Drop all existing policies for clients
DROP POLICY IF EXISTS "Users can only see their own clients" ON clients;
DROP POLICY IF EXISTS "Users can only insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can only update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can only delete their own clients" ON clients;
DROP POLICY IF EXISTS "All users can view clients" ON clients;
DROP POLICY IF EXISTS "All users can insert clients" ON clients;
DROP POLICY IF EXISTS "All users can update clients" ON clients;
DROP POLICY IF EXISTS "All users can delete clients" ON clients;
DROP POLICY IF EXISTS "Users can view all clients" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Users can delete clients" ON clients;
DROP POLICY IF EXISTS "Allow anon read access to clients" ON clients;

-- Drop all existing policies for interactions
DROP POLICY IF EXISTS "Users can only see their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can only insert their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can only update their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can only delete their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can view all interactions" ON interactions;
DROP POLICY IF EXISTS "Users can insert interactions" ON interactions;
DROP POLICY IF EXISTS "Users can update interactions" ON interactions;
DROP POLICY IF EXISTS "Users can delete interactions" ON interactions;

-- Drop all existing policies for tasks
DROP POLICY IF EXISTS "Users can only see their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can only insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can only update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can only delete their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;
DROP POLICY IF EXISTS "Allow anon read access to tasks" ON tasks;

-- Drop all existing policies for calendar_events
DROP POLICY IF EXISTS "Users can only see their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can only insert their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can only update their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can only delete their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can view all calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Allow anon read access to calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can view shared calendar events or their own" ON calendar_events;
DROP POLICY IF EXISTS "Users can update shared events or their own" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete shared events or their own" ON calendar_events;

-- Drop all existing policies for journal_entries
DROP POLICY IF EXISTS "Users can only see their own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can only insert their own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can only update their own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can only delete their own journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can view all journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can insert journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can update journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can delete journal entries" ON journal_entries;

-- Drop all existing policies for meeting_notes
DROP POLICY IF EXISTS "Users can view all meeting notes" ON meeting_notes;
DROP POLICY IF EXISTS "Users can insert meeting notes" ON meeting_notes;
DROP POLICY IF EXISTS "Users can update meeting notes" ON meeting_notes;
DROP POLICY IF EXISTS "Users can delete meeting notes" ON meeting_notes;

-- Drop all existing policies for ai_optimizations
DROP POLICY IF EXISTS "Users can view ai optimizations" ON ai_optimizations;
DROP POLICY IF EXISTS "Users can insert ai optimizations" ON ai_optimizations;
DROP POLICY IF EXISTS "Users can update ai optimizations" ON ai_optimizations;
DROP POLICY IF EXISTS "Users can delete ai optimizations" ON ai_optimizations;

-- Add columns for shared/private distinction
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_general BOOLEAN DEFAULT false;

-- Create new policies for SHARED data (CRM, team, shared calendar, general chat, analytics)

-- Clients (CRM) - Shared, all users can CRUD
CREATE POLICY "Team can manage clients" ON clients FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Interactions (CRM) - Shared, all users can CRUD
CREATE POLICY "Team can manage interactions" ON interactions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tasks (Team) - Shared, all users can CRUD
CREATE POLICY "Team can manage tasks" ON tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Meeting notes (Team) - Shared, all users can CRUD
CREATE POLICY "Team can manage meeting notes" ON meeting_notes FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- AI optimizations (Analytics) - Shared, all users can CRUD
CREATE POLICY "Team can manage ai optimizations" ON ai_optimizations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Calendar events - Mixed: shared events accessible to all, personal events only to owner
CREATE POLICY "Team can view shared or own calendar events" ON calendar_events
    FOR SELECT TO authenticated USING (
        is_shared = true OR 
        user_id = auth.uid() OR 
        created_by = auth.uid()
    );

CREATE POLICY "Team can create calendar events" ON calendar_events
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team can update shared or own calendar events" ON calendar_events
    FOR UPDATE TO authenticated USING (
        is_shared = true OR 
        user_id = auth.uid() OR 
        created_by = auth.uid()
    );

CREATE POLICY "Team can delete shared or own calendar events" ON calendar_events
    FOR DELETE TO authenticated USING (
        is_shared = true OR 
        user_id = auth.uid() OR 
        created_by = auth.uid()
    );

-- Create new policies for PRIVATE data (personal calendar, journal, AI chats)

-- Journal entries - Private, only owner can access
CREATE POLICY "Users can manage own journal entries" ON journal_entries
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- AI chat sessions - Private, only owner can access
CREATE POLICY "Users can manage own ai chat sessions" ON ai_chat_sessions
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- AI chat messages - Private, only owner can access
CREATE POLICY "Users can manage own ai chat messages" ON ai_chat_messages
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM ai_chat_sessions 
            WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
            AND ai_chat_sessions.user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_chat_sessions 
            WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
            AND ai_chat_sessions.user_id = auth.uid()
        )
    );

-- User settings - Private, only owner can access
CREATE POLICY "Users can manage own settings" ON user_settings
    FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Chat rooms - Mixed: general chats accessible to all, private chats only to participants
CREATE POLICY "Team can access general or own chat rooms" ON chat_rooms
    FOR SELECT TO authenticated USING (
        is_general = true OR 
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE chat_participants.room_id = chat_rooms.id 
            AND chat_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Team can create chat rooms" ON chat_rooms
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Team can update general or own chat rooms" ON chat_rooms
    FOR UPDATE TO authenticated USING (
        is_general = true OR 
        user_id = auth.uid()
    );

CREATE POLICY "Team can delete general or own chat rooms" ON chat_rooms
    FOR DELETE TO authenticated USING (
        is_general = true OR 
        user_id = auth.uid()
    );

-- Chat messages - Follow chat room access rules
CREATE POLICY "Team can access messages in accessible rooms" ON chat_messages
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM chat_rooms 
            WHERE chat_rooms.id = chat_messages.room_id 
            AND (
                chat_rooms.is_general = true OR 
                chat_rooms.user_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM chat_participants 
                    WHERE chat_participants.room_id = chat_rooms.id 
                    AND chat_participants.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Team can send messages in accessible rooms" ON chat_messages
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_rooms 
            WHERE chat_rooms.id = chat_messages.room_id 
            AND (
                chat_rooms.is_general = true OR 
                chat_rooms.user_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM chat_participants 
                    WHERE chat_participants.room_id = chat_rooms.id 
                    AND chat_participants.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Team can update own messages" ON chat_messages
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Team can delete own messages" ON chat_messages
    FOR DELETE TO authenticated USING (user_id = auth.uid());

-- File attachments - Accessible to all team members
CREATE POLICY "Team can manage file attachments" ON file_attachments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Chat participants - Team can manage
CREATE POLICY "Team can manage chat participants" ON chat_participants
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Task groups and related tables - Shared team data
CREATE POLICY "Team can manage task groups" ON task_groups
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Team can manage task group members" ON task_group_members
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Team can manage shared tasks" ON shared_tasks
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Users table - Users can view all profiles but only update their own
CREATE POLICY "Team can view all user profiles" ON users
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE TO authenticated USING (auth.uid()::text = id::text);