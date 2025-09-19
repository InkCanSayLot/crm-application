-- Calendar Enhancement Migration
-- Add new tables and modify existing ones for shared tasks, task groups, and timeline features

-- Create task_groups table
CREATE TABLE task_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for task_groups
CREATE INDEX idx_task_groups_created_by ON task_groups(created_by);
CREATE INDEX idx_task_groups_created_at ON task_groups(created_at DESC);

-- Grant permissions for task_groups
GRANT SELECT ON task_groups TO anon;
GRANT ALL PRIVILEGES ON task_groups TO authenticated;

-- Create RLS policy for task_groups
ALTER TABLE task_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage task groups" ON task_groups FOR ALL TO authenticated USING (true);

-- Create task_group_members table
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

-- Grant permissions for task_group_members
GRANT SELECT ON task_group_members TO anon;
GRANT ALL PRIVILEGES ON task_group_members TO authenticated;

-- Create RLS policy for task_group_members
ALTER TABLE task_group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage task group members" ON task_group_members FOR ALL TO authenticated USING (true);

-- Create shared_tasks table
CREATE TABLE shared_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES users(id),
    permission_level VARCHAR(20) DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for shared_tasks
CREATE INDEX idx_shared_tasks_task_id ON shared_tasks(task_id);
CREATE INDEX idx_shared_tasks_shared_with ON shared_tasks(shared_with);
CREATE UNIQUE INDEX idx_shared_tasks_unique ON shared_tasks(task_id, shared_with);

-- Grant permissions for shared_tasks
GRANT SELECT ON shared_tasks TO anon;
GRANT ALL PRIVILEGES ON shared_tasks TO authenticated;

-- Create RLS policy for shared_tasks
ALTER TABLE shared_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage shared tasks" ON shared_tasks FOR ALL TO authenticated USING (true);

-- Add new columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_shared BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS task_group_id UUID REFERENCES task_groups(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- Add new columns to calendar_events table
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS shared_with_team BOOLEAN DEFAULT false;
ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id);

-- Create additional indexes for modified tables
CREATE INDEX IF NOT EXISTS idx_tasks_is_shared ON tasks(is_shared);
CREATE INDEX IF NOT EXISTS idx_tasks_task_group_id ON tasks(task_group_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_client_id ON calendar_events(client_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_shared ON calendar_events(shared_with_team);

-- Insert sample task groups
INSERT INTO task_groups (name, description, created_by) VALUES
('Client Onboarding', 'Complete client setup and initial engagement process', (SELECT id FROM users WHERE email = 'will@emptyad.com')),
('Product Demo Preparation', 'Prepare and deliver product demonstrations', (SELECT id FROM users WHERE email = 'beck@emptyad.com')),
('Technical Implementation', 'Technical setup and configuration tasks', (SELECT id FROM users WHERE email = 'roman@emptyad.com'));

-- Update existing tasks to be part of task groups
UPDATE tasks SET 
    task_group_id = (SELECT id FROM task_groups WHERE name = 'Client Onboarding' LIMIT 1),
    is_shared = true,
    completed = false
WHERE title LIKE '%follow up%' OR title LIKE '%meeting%';

UPDATE tasks SET 
    task_group_id = (SELECT id FROM task_groups WHERE name = 'Product Demo Preparation' LIMIT 1),
    is_shared = true,
    completed = false
WHERE title LIKE '%demo%' OR title LIKE '%presentation%';

-- Create function to update task_groups updated_at timestamp
CREATE OR REPLACE FUNCTION update_task_groups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task_groups updated_at
CREATE TRIGGER trigger_update_task_groups_updated_at
    BEFORE UPDATE ON task_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_task_groups_updated_at();

-- Check permissions for the new tables and grant access to the anon and authenticated roles
-- This ensures proper access control is in place before any data operations are performed