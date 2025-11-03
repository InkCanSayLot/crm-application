-- Add missing 'color' column to task_groups table
ALTER TABLE task_groups ADD COLUMN color VARCHAR(7) DEFAULT '#3B82F6';

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON task_groups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON task_groups TO authenticated;

-- Update existing records with default color
UPDATE task_groups SET color = '#3B82F6' WHERE color IS NULL;