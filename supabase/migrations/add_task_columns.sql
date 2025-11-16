-- Add missing columns to tasks table for enhanced functionality

-- Add completed column
ALTER TABLE tasks ADD COLUMN completed BOOLEAN DEFAULT FALSE;

-- Add task_group_id column for task grouping
ALTER TABLE tasks ADD COLUMN task_group_id UUID;

-- Add is_shared column for task sharing
ALTER TABLE tasks ADD COLUMN is_shared BOOLEAN DEFAULT FALSE;

-- Add indexes for the new fields
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_task_group_id ON tasks(task_group_id);
CREATE INDEX idx_tasks_is_shared ON tasks(is_shared);

-- Grant permissions for the updated table
GRANT SELECT, INSERT, UPDATE ON tasks TO authenticated;
GRANT SELECT ON tasks TO anon;

-- Add comments for documentation
COMMENT ON COLUMN tasks.completed IS 'Whether the task is completed';
COMMENT ON COLUMN tasks.task_group_id IS 'Reference to task group this task belongs to';
COMMENT ON COLUMN tasks.is_shared IS 'Whether this task is shared with other users';