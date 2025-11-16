-- Create task_groups table for organizing tasks
CREATE TABLE task_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task_group_members table for task-group relationships
CREATE TABLE task_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_group_id UUID REFERENCES task_groups(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_group_id, task_id)
);

-- Create shared_tasks table for task sharing functionality
CREATE TABLE shared_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_level VARCHAR(20) DEFAULT 'view' CHECK (permission_level IN ('view', 'edit')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(task_id, shared_with)
);

-- Add indexes for performance
CREATE INDEX idx_task_groups_created_by ON task_groups(created_by);
CREATE INDEX idx_task_group_members_task_group_id ON task_group_members(task_group_id);
CREATE INDEX idx_task_group_members_task_id ON task_group_members(task_id);
CREATE INDEX idx_shared_tasks_task_id ON shared_tasks(task_id);
CREATE INDEX idx_shared_tasks_shared_with ON shared_tasks(shared_with);

-- Enable RLS
ALTER TABLE task_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all task groups" ON task_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage their own task groups" ON task_groups FOR ALL TO authenticated USING (created_by = auth.uid());

CREATE POLICY "Users can view task group members" ON task_group_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage task group members" ON task_group_members FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view shared tasks" ON shared_tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage shared tasks" ON shared_tasks FOR ALL TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON task_groups TO anon;
GRANT ALL PRIVILEGES ON task_groups TO authenticated;

GRANT SELECT ON task_group_members TO anon;
GRANT ALL PRIVILEGES ON task_group_members TO authenticated;

GRANT SELECT ON shared_tasks TO anon;
GRANT ALL PRIVILEGES ON shared_tasks TO authenticated;