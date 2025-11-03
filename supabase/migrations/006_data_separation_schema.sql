-- Data Separation Schema Migration
-- Separates shared data from user-specific data according to requirements
-- Shared: dashboard, CRM, team, shared calendar, general chat, analytics
-- User-specific: personal calendar, journal, AI chats, private messages

-- AI Chat Sessions Table (User-specific)
CREATE TABLE ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
CREATE INDEX idx_ai_chat_sessions_updated_at ON ai_chat_sessions(updated_at DESC);

-- AI Chat Messages Table (User-specific)
CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_messages_created_at ON ai_chat_messages(created_at);

-- Update calendar_events to better separate shared vs personal
-- Add explicit user_id for personal events (when is_collective = false)
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);

-- Enable Row Level Security on new tables
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Grant permissions for AI chat tables
GRANT SELECT ON ai_chat_sessions TO anon;
GRANT ALL PRIVILEGES ON ai_chat_sessions TO authenticated;
GRANT SELECT ON ai_chat_messages TO anon;
GRANT ALL PRIVILEGES ON ai_chat_messages TO authenticated;

-- RLS Policies for AI Chat Sessions (User-specific)
CREATE POLICY "Users can view their own AI chat sessions" 
    ON ai_chat_sessions FOR SELECT 
    TO authenticated 
    USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create their own AI chat sessions" 
    ON ai_chat_sessions FOR INSERT 
    TO authenticated 
    WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can update their own AI chat sessions" 
    ON ai_chat_sessions FOR UPDATE 
    TO authenticated 
    USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete their own AI chat sessions" 
    ON ai_chat_sessions FOR DELETE 
    TO authenticated 
    USING (user_id::text = auth.uid()::text);

-- RLS Policies for AI Chat Messages (User-specific via session)
CREATE POLICY "Users can view their own AI chat messages" 
    ON ai_chat_messages FOR SELECT 
    TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM ai_chat_sessions 
        WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
        AND ai_chat_sessions.user_id::text = auth.uid()::text
    ));

CREATE POLICY "Users can create messages in their own AI chat sessions" 
    ON ai_chat_messages FOR INSERT 
    TO authenticated 
    WITH CHECK (EXISTS (
        SELECT 1 FROM ai_chat_sessions 
        WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
        AND ai_chat_sessions.user_id::text = auth.uid()::text
    ));

CREATE POLICY "Users can update messages in their own AI chat sessions" 
    ON ai_chat_messages FOR UPDATE 
    TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM ai_chat_sessions 
        WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
        AND ai_chat_sessions.user_id::text = auth.uid()::text
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM ai_chat_sessions 
        WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
        AND ai_chat_sessions.user_id::text = auth.uid()::text
    ));

CREATE POLICY "Users can delete messages in their own AI chat sessions" 
    ON ai_chat_messages FOR DELETE 
    TO authenticated 
    USING (EXISTS (
        SELECT 1 FROM ai_chat_sessions 
        WHERE ai_chat_sessions.id = ai_chat_messages.session_id 
        AND ai_chat_sessions.user_id::text = auth.uid()::text
    ));

-- Update Calendar Events RLS for personal events
-- Drop existing policies and recreate with proper user separation
DROP POLICY IF EXISTS "Users can view all calendar events" ON calendar_events;
DROP POLICY IF EXISTS "Users can manage calendar events" ON calendar_events;

-- New calendar policies: shared events visible to all, personal events only to owner
CREATE POLICY "Users can view shared calendar events" 
    ON calendar_events FOR SELECT 
    TO authenticated 
    USING (is_collective = true);

CREATE POLICY "Users can view their own personal calendar events" 
    ON calendar_events FOR SELECT 
    TO authenticated 
    USING (is_collective = false AND user_id::text = auth.uid()::text);

CREATE POLICY "Users can manage shared calendar events" 
    ON calendar_events FOR ALL 
    TO authenticated 
    USING (is_collective = true);

CREATE POLICY "Users can manage their own personal calendar events" 
    ON calendar_events FOR ALL 
    TO authenticated 
    USING (is_collective = false AND user_id::text = auth.uid()::text)
    WITH CHECK (is_collective = false AND user_id::text = auth.uid()::text);

-- Ensure existing shared calendar events remain accessible
UPDATE calendar_events SET is_collective = true WHERE is_collective IS NULL;

-- Update journal entries policy to be more explicit (already user-specific)
DROP POLICY IF EXISTS "Users can view all journal entries" ON journal_entries;
DROP POLICY IF EXISTS "Users can manage their own journal entries" ON journal_entries;

CREATE POLICY "Users can view their own journal entries" 
    ON journal_entries FOR SELECT 
    TO authenticated 
    USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can manage their own journal entries" 
    ON journal_entries FOR ALL 
    TO authenticated 
    USING (user_id::text = auth.uid()::text)
    WITH CHECK (user_id::text = auth.uid()::text);

-- Maintain shared access for common data (CRM, tasks, etc.)
-- These policies remain as-is since they should be shared:
-- - users (team data)
-- - clients (CRM data)
-- - interactions (CRM data)
-- - tasks (shared tasks)
-- - chat_rooms and chat_messages (general live chat)
-- - meeting_notes (shared)
-- - ai_optimizations (analytics)

-- Add comment for clarity
COMMENT ON TABLE ai_chat_sessions IS 'User-specific AI chat sessions - each user has their own conversations';
COMMENT ON TABLE ai_chat_messages IS 'Messages within AI chat sessions - linked to user via session';
COMMENT ON COLUMN calendar_events.user_id IS 'Owner of personal calendar events (when is_collective = false)';
COMMENT ON COLUMN calendar_events.is_collective IS 'true = shared calendar event, false = personal event';