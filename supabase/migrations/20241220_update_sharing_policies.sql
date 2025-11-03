-- Update RLS policies based on user requirements:
-- Shared data: dashboard, CRM (clients), team, shared calendar, general chat, analytics
-- Private data: personal calendar, journal, AI chats, individual live chats

-- Drop existing restrictive policies for shared data
DROP POLICY IF EXISTS "Users can only see their own clients" ON clients;
DROP POLICY IF EXISTS "Users can only insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can only update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can only delete their own clients" ON clients;

-- Create shared policies for CRM clients (accessible to all authenticated users)
CREATE POLICY "All users can view clients" ON clients
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "All users can insert clients" ON clients
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "All users can update clients" ON clients
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "All users can delete clients" ON clients
    FOR DELETE TO authenticated USING (true);

-- Update interactions policies (shared CRM data)
DROP POLICY IF EXISTS "Users can only see their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can only insert their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can only update their own interactions" ON interactions;
DROP POLICY IF EXISTS "Users can only delete their own interactions" ON interactions;

CREATE POLICY "All users can view interactions" ON interactions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "All users can insert interactions" ON interactions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "All users can update interactions" ON interactions
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "All users can delete interactions" ON interactions
    FOR DELETE TO authenticated USING (true);

-- Update tasks policies (shared team data)
DROP POLICY IF EXISTS "Users can only see their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can only insert their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can only update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can only delete their own tasks" ON tasks;

CREATE POLICY "All users can view tasks" ON tasks
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "All users can insert tasks" ON tasks
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "All users can update tasks" ON tasks
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "All users can delete tasks" ON tasks
    FOR DELETE TO authenticated USING (true);

-- Calendar events: Shared calendar events vs personal calendar events
-- We'll use a 'is_shared' column or similar logic to differentiate
DROP POLICY IF EXISTS "Users can only see their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can only insert their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can only update their own calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can only delete their own calendar events" ON calendar_events;

-- Add is_shared column if it doesn't exist
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;

-- Calendar policies: shared events accessible to all, personal events only to owner
CREATE POLICY "Users can view shared calendar events or their own" ON calendar_events
    FOR SELECT TO authenticated USING (
        is_shared = true OR 
        user_id = auth.uid() OR 
        created_by = auth.uid()
    );

CREATE POLICY "Users can insert calendar events" ON calendar_events
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update shared events or their own" ON calendar_events
    FOR UPDATE TO authenticated USING (
        is_shared = true OR 
        user_id = auth.uid() OR 
        created_by = auth.uid()
    );

CREATE POLICY "Users can delete shared events or their own" ON calendar_events
    FOR DELETE TO authenticated USING (
        is_shared = true OR 
        user_id = auth.uid() OR 
        created_by = auth.uid()
    );

-- Journal entries: Keep private (user-specific)
-- These policies are already correct from previous migration

-- Meeting notes: Shared team data
DROP POLICY IF EXISTS "Users can only see their own meeting notes" ON meeting_notes;
DROP POLICY IF EXISTS "Users can only insert their own meeting notes" ON meeting_notes;
DROP POLICY IF EXISTS "Users can only update their own meeting notes" ON meeting_notes;
DROP POLICY IF EXISTS "Users can only delete their own meeting notes" ON meeting_notes;

CREATE POLICY "All users can view meeting notes" ON meeting_notes
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "All users can insert meeting notes" ON meeting_notes
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "All users can update meeting notes" ON meeting_notes
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "All users can delete meeting notes" ON meeting_notes
    FOR DELETE TO authenticated USING (true);

-- AI chat sessions and messages: Keep private (user-specific)
-- These should remain user-specific as per requirements

-- Chat rooms and messages: Differentiate between general chat (shared) and private chats
-- Add is_general column to chat_rooms if it doesn't exist
ALTER TABLE chat_rooms ADD COLUMN IF NOT EXISTS is_general BOOLEAN DEFAULT false;

-- Update chat room policies
DROP POLICY IF EXISTS "Users can access their chat rooms" ON chat_rooms;
CREATE POLICY "Users can access general chats or their own rooms" ON chat_rooms
    FOR SELECT TO authenticated USING (
        is_general = true OR 
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM chat_participants 
            WHERE chat_participants.room_id = chat_rooms.id 
            AND chat_participants.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create chat rooms" ON chat_rooms
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can update general chats or their own rooms" ON chat_rooms
    FOR UPDATE TO authenticated USING (
        is_general = true OR 
        user_id = auth.uid()
    );

-- Update chat messages policies
DROP POLICY IF EXISTS "Users can access messages from their chat rooms" ON chat_messages;
CREATE POLICY "Users can access messages from general or accessible rooms" ON chat_messages
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

CREATE POLICY "Users can insert messages in accessible rooms" ON chat_messages
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

-- Analytics data: Shared (accessible to all)
-- AI optimizations can be considered analytics data
DROP POLICY IF EXISTS "Users can only see their own ai optimizations" ON ai_optimizations;
DROP POLICY IF EXISTS "Users can only insert their own ai optimizations" ON ai_optimizations;
DROP POLICY IF EXISTS "Users can only update their own ai optimizations" ON ai_optimizations;
DROP POLICY IF EXISTS "Users can only delete their own ai optimizations" ON ai_optimizations;

CREATE POLICY "All users can view ai optimizations" ON ai_optimizations
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "All users can insert ai optimizations" ON ai_optimizations
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "All users can update ai optimizations" ON ai_optimizations
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "All users can delete ai optimizations" ON ai_optimizations
    FOR DELETE TO authenticated USING (true);

-- File attachments: Should follow the same pattern as their parent entities
-- For now, make them accessible to all authenticated users
DROP POLICY IF EXISTS "Users can only see their own file attachments" ON file_attachments;
CREATE POLICY "All users can view file attachments" ON file_attachments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "All users can insert file attachments" ON file_attachments
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "All users can update file attachments" ON file_attachments
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "All users can delete file attachments" ON file_attachments
    FOR DELETE TO authenticated USING (true);

-- User settings: Keep private (user-specific)
-- These should remain user-specific