-- =====================================================
-- CLEAN DATABASE REBUILD MIGRATION
-- =====================================================
-- This migration performs a complete database cleanup and rebuild
-- for the Empty CRM Personal project
-- 
-- WARNING: This will DROP ALL existing tables and data!
-- Make sure you have a backup before running this migration.
-- =====================================================

-- Step 1: Drop all existing tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS ai_optimizations CASCADE;
DROP TABLE IF EXISTS meeting_notes CASCADE;
DROP TABLE IF EXISTS journal_entries CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_participants CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;
DROP TABLE IF EXISTS task_group_members CASCADE;
DROP TABLE IF EXISTS shared_tasks CASCADE;
DROP TABLE IF EXISTS interactions CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS task_groups CASCADE;
DROP TABLE IF EXISTS calendar_events CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any existing functions and triggers
DROP FUNCTION IF EXISTS update_task_groups_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Step 2: Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 3: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 4: Create Users Table (Enhanced)
CREATE TABLE users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    name VARCHAR(100), -- Legacy compatibility
    role VARCHAR(50) CHECK (role IN ('CEO', 'CGO', 'CTO', 'admin', 'user')),
    avatar_url TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for users updated_at
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 5: Create Clients Table
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    linkedin_url TEXT,
    stage VARCHAR(50) DEFAULT 'prospect' CHECK (stage IN ('prospect', 'connected', 'replied', 'meeting', 'proposal', 'closed', 'lost')),
    deal_value DECIMAL(10,2),
    assigned_to UUID REFERENCES users(id),
    last_contact_note TEXT,
    user_id UUID REFERENCES users(id), -- For data separation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for clients
CREATE INDEX idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX idx_clients_stage ON clients(stage);
CREATE INDEX idx_clients_user_id ON clients(user_id);

-- Create trigger for clients updated_at
CREATE TRIGGER trigger_update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Create Task Groups Table
CREATE TABLE task_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(50) DEFAULT '#3B82F6', -- Supports hex codes and CSS variables
    created_by UUID REFERENCES users(id),
    user_id UUID REFERENCES users(id), -- For data separation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for task_groups
CREATE INDEX idx_task_groups_created_by ON task_groups(created_by);
CREATE INDEX idx_task_groups_user_id ON task_groups(user_id);
CREATE INDEX idx_task_groups_created_at ON task_groups(created_at DESC);

-- Create trigger for task_groups updated_at
CREATE TRIGGER trigger_update_task_groups_updated_at
    BEFORE UPDATE ON task_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Create Tasks Table (Enhanced)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to UUID REFERENCES users(id),
    client_id UUID REFERENCES clients(id),
    task_group_id UUID REFERENCES task_groups(id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES users(id), -- For data separation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for tasks
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_task_group_id ON tasks(task_group_id);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Create trigger for tasks updated_at
CREATE TRIGGER trigger_update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Create Shared Tasks Table
CREATE TABLE shared_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    task_group_id UUID REFERENCES task_groups(id) ON DELETE CASCADE,
    due_date TIMESTAMP WITH TIME ZONE,
    is_shared BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for shared_tasks
CREATE INDEX idx_shared_tasks_assigned_to ON shared_tasks(assigned_to);
CREATE INDEX idx_shared_tasks_created_by ON shared_tasks(created_by);
CREATE INDEX idx_shared_tasks_status ON shared_tasks(status);
CREATE INDEX idx_shared_tasks_task_group_id ON shared_tasks(task_group_id);

-- Step 9: Create Task Group Members Table
CREATE TABLE task_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_group_id UUID REFERENCES task_groups(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for task_group_members
CREATE INDEX idx_task_group_members_group_id ON task_group_members(task_group_id);
CREATE INDEX idx_task_group_members_task_id ON task_group_members(task_id);
CREATE INDEX idx_task_group_members_order ON task_group_members(task_group_id, order_index);

-- Step 10: Create Calendar Events Table
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50) DEFAULT 'meeting' CHECK (type IN ('meeting', 'sync', 'block', 'personal')),
    created_by UUID REFERENCES users(id),
    is_collective BOOLEAN DEFAULT false,
    user_id UUID REFERENCES users(id), -- For data separation
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for calendar_events
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);

-- Step 11: Create Chat Tables
CREATE TABLE chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
    created_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(room_id, user_id)
);

CREATE TABLE chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'shared_content', 'file')),
    shared_content JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 12: Create Interactions Table
CREATE TABLE interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    type VARCHAR(50) NOT NULL CHECK (type IN ('linkedin_connection', 'linkedin_message', 'email', 'phone_call', 'meeting')),
    status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'received', 'replied', 'ignored', 'completed')),
    content TEXT,
    notes TEXT,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for interactions
CREATE INDEX idx_interactions_client_id ON interactions(client_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_date ON interactions(interaction_date DESC);

-- Step 13: Create Journal Entries Table
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    sales_accomplishment TEXT,
    marketing_accomplishment TEXT,
    ops_accomplishment TEXT,
    tech_accomplishment TEXT,
    random_thoughts TEXT,
    entry_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index for journal_entries
CREATE UNIQUE INDEX idx_journal_entries_user_date ON journal_entries(user_id, entry_date);

-- Step 14: Create Meeting Notes Table
CREATE TABLE meeting_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_event_id UUID REFERENCES calendar_events(id),
    created_by UUID REFERENCES users(id),
    raw_notes TEXT,
    ai_summary TEXT,
    action_items JSONB,
    meeting_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for meeting_notes
CREATE INDEX idx_meeting_notes_date ON meeting_notes(meeting_date DESC);
CREATE INDEX idx_meeting_notes_created_by ON meeting_notes(created_by);

-- Step 15: Create AI Optimizations Table
CREATE TABLE ai_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID REFERENCES interactions(id),
    message_type VARCHAR(50) NOT NULL,
    original_message TEXT,
    optimized_message TEXT,
    performance_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for ai_optimizations
CREATE INDEX idx_ai_optimizations_interaction_id ON ai_optimizations(interaction_id);
CREATE INDEX idx_ai_optimizations_performance ON ai_optimizations(performance_score DESC);

-- Step 16: Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_optimizations ENABLE ROW LEVEL SECURITY;

-- Step 17: Grant Permissions
-- Grant permissions to authenticated users
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant select permissions to anon users
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Step 18: Create RLS Policies
-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Clients policies
CREATE POLICY "Users can view all clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage clients" ON clients FOR ALL TO authenticated USING (true);

-- Task groups policies
CREATE POLICY "Users can view all task groups" ON task_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage task groups" ON task_groups FOR ALL TO authenticated USING (true);

-- Tasks policies
CREATE POLICY "Users can view all tasks" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage tasks" ON tasks FOR ALL TO authenticated USING (true);

-- Shared tasks policies
CREATE POLICY "Users can view all shared tasks" ON shared_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage shared tasks" ON shared_tasks FOR ALL TO authenticated USING (true);

-- Task group members policies
CREATE POLICY "Users can view task group members" ON task_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage task group members" ON task_group_members FOR ALL TO authenticated USING (true);

-- Calendar events policies
CREATE POLICY "Users can view all calendar events" ON calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage calendar events" ON calendar_events FOR ALL TO authenticated USING (true);

-- Chat policies
CREATE POLICY "Users can view chat rooms" ON chat_rooms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage chat rooms" ON chat_rooms FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view chat participants" ON chat_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage chat participants" ON chat_participants FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view chat messages" ON chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage chat messages" ON chat_messages FOR ALL TO authenticated USING (true);

-- Interactions policies
CREATE POLICY "Users can view all interactions" ON interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage interactions" ON interactions FOR ALL TO authenticated USING (true);

-- Journal entries policies
CREATE POLICY "Users can view all journal entries" ON journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own journal entries" ON journal_entries FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Meeting notes policies
CREATE POLICY "Users can view all meeting notes" ON meeting_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage meeting notes" ON meeting_notes FOR ALL TO authenticated USING (true);

-- AI optimizations policies
CREATE POLICY "Users can view all ai optimizations" ON ai_optimizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage ai optimizations" ON ai_optimizations FOR ALL TO authenticated USING (true);

-- Step 19: Create General Chat Room
INSERT INTO chat_rooms (id, name, type, created_by) VALUES 
('00000000-0000-0000-0000-000000000001', 'General', 'group', NULL)
ON CONFLICT (id) DO NOTHING;

-- Step 20: Add comments for documentation
COMMENT ON TABLE users IS 'User profiles with authentication integration';
COMMENT ON TABLE clients IS 'CRM client records with sales pipeline tracking';
COMMENT ON TABLE task_groups IS 'Task organization groups with color coding';
COMMENT ON TABLE tasks IS 'Individual tasks with assignment and tracking';
COMMENT ON TABLE shared_tasks IS 'Collaborative tasks shared between team members';
COMMENT ON TABLE calendar_events IS 'Calendar events and meetings';
COMMENT ON TABLE chat_rooms IS 'Chat rooms for team communication';
COMMENT ON TABLE chat_messages IS 'Messages within chat rooms';
COMMENT ON TABLE interactions IS 'Client interaction history';
COMMENT ON TABLE journal_entries IS 'Daily accomplishment journals';
COMMENT ON TABLE meeting_notes IS 'Meeting notes with AI summaries';
COMMENT ON TABLE ai_optimizations IS 'AI-optimized message suggestions';

COMMENT ON COLUMN task_groups.color IS 'Color value - supports hex codes and CSS variables';
COMMENT ON COLUMN users.full_name IS 'User display name';
COMMENT ON COLUMN users.is_online IS 'Real-time online status';

-- Migration completed successfully
SELECT 'Database rebuild completed successfully!' as status;