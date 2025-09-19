-- Empty Operations CRM PWA - Initial Database Schema
-- This migration creates all required tables for the CRM system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('CEO', 'CGO', 'CTO')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Initial data
INSERT INTO users (email, name, role) VALUES
('will@emptyad.com', 'William Walsh', 'CEO'),
('beck@emptyad.com', 'Beck Majdell', 'CGO'),
('roman@emptyad.com', 'M.A. Roman', 'CTO');

-- Clients Table
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clients_assigned_to ON clients(assigned_to);
CREATE INDEX idx_clients_stage ON clients(stage);
GRANT SELECT ON clients TO anon;
GRANT ALL PRIVILEGES ON clients TO authenticated;

-- Interactions Table
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

CREATE INDEX idx_interactions_client_id ON interactions(client_id);
CREATE INDEX idx_interactions_user_id ON interactions(user_id);
CREATE INDEX idx_interactions_date ON interactions(interaction_date DESC);
GRANT SELECT ON interactions TO anon;
GRANT ALL PRIVILEGES ON interactions TO authenticated;

-- Tasks Table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to UUID REFERENCES users(id),
    client_id UUID REFERENCES clients(id),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
GRANT SELECT ON tasks TO anon;
GRANT ALL PRIVILEGES ON tasks TO authenticated;

-- Calendar Events Table
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    type VARCHAR(50) DEFAULT 'meeting' CHECK (type IN ('meeting', 'sync', 'block', 'personal')),
    created_by UUID REFERENCES users(id),
    is_collective BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_created_by ON calendar_events(created_by);
GRANT SELECT ON calendar_events TO anon;
GRANT ALL PRIVILEGES ON calendar_events TO authenticated;

-- Journal Entries Table
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

CREATE UNIQUE INDEX idx_journal_entries_user_date ON journal_entries(user_id, entry_date);
GRANT SELECT ON journal_entries TO anon;
GRANT ALL PRIVILEGES ON journal_entries TO authenticated;

-- Meeting Notes Table
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

CREATE INDEX idx_meeting_notes_date ON meeting_notes(meeting_date DESC);
CREATE INDEX idx_meeting_notes_created_by ON meeting_notes(created_by);
GRANT SELECT ON meeting_notes TO anon;
GRANT ALL PRIVILEGES ON meeting_notes TO authenticated;

-- AI Optimizations Table
CREATE TABLE ai_optimizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    interaction_id UUID REFERENCES interactions(id),
    message_type VARCHAR(50) NOT NULL,
    original_message TEXT,
    optimized_message TEXT,
    performance_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ai_optimizations_interaction_id ON ai_optimizations(interaction_id);
CREATE INDEX idx_ai_optimizations_performance ON ai_optimizations(performance_score DESC);
GRANT SELECT ON ai_optimizations TO anon;
GRANT ALL PRIVILEGES ON ai_optimizations TO authenticated;

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_optimizations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can view all users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE TO authenticated USING (auth.uid()::text = id::text);

CREATE POLICY "Users can view all clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage clients" ON clients FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view all interactions" ON interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage interactions" ON interactions FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view all tasks" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage tasks" ON tasks FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view all calendar events" ON calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage calendar events" ON calendar_events FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view all journal entries" ON journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own journal entries" ON journal_entries FOR ALL TO authenticated USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can view all meeting notes" ON meeting_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage meeting notes" ON meeting_notes FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view all ai optimizations" ON ai_optimizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage ai optimizations" ON ai_optimizations FOR ALL TO authenticated USING (true);

-- Insert some sample data for testing
INSERT INTO clients (company_name, contact_name, email, stage, deal_value, assigned_to) VALUES
('TechCorp Solutions', 'John Smith', 'john@techcorp.com', 'prospect', 50000.00, (SELECT id FROM users WHERE email = 'beck@emptyad.com')),
('Digital Innovations', 'Sarah Johnson', 'sarah@digitalinnovations.com', 'connected', 75000.00, (SELECT id FROM users WHERE email = 'beck@emptyad.com')),
('StartupXYZ', 'Mike Chen', 'mike@startupxyz.com', 'meeting', 25000.00, (SELECT id FROM users WHERE email = 'will@emptyad.com'));

INSERT INTO tasks (title, description, status, priority, assigned_to, due_date) VALUES
('Follow up with TechCorp', 'Send proposal follow-up email', 'pending', 'high', (SELECT id FROM users WHERE email = 'beck@emptyad.com'), NOW() + INTERVAL '2 days'),
('Prepare demo for Digital Innovations', 'Create custom demo presentation', 'in_progress', 'medium', (SELECT id FROM users WHERE email = 'roman@emptyad.com'), NOW() + INTERVAL '5 days'),
('Schedule meeting with StartupXYZ', 'Coordinate calendars for next week', 'pending', 'medium', (SELECT id FROM users WHERE email = 'will@emptyad.com'), NOW() + INTERVAL '1 day');

INSERT INTO calendar_events (title, description, start_time, end_time, type, created_by, is_collective) VALUES
('Daily Sync Meeting', 'Team coordination and updates', NOW()::date + INTERVAL '9 hours', NOW()::date + INTERVAL '9 hours 30 minutes', 'sync', (SELECT id FROM users WHERE email = 'will@emptyad.com'), true),
('Client Demo - Digital Innovations', 'Product demonstration call', NOW()::date + INTERVAL '1 day 14 hours', NOW()::date + INTERVAL '1 day 15 hours', 'meeting', (SELECT id FROM users WHERE email = 'beck@emptyad.com'), false);