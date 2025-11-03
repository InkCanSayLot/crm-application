-- Fix task_groups color column constraint to allow CSS variables
ALTER TABLE task_groups ALTER COLUMN color TYPE VARCHAR(50);

-- Update any existing records that might have been truncated
-- Set default color for any NULL values
UPDATE task_groups SET color = '#3B82F6' WHERE color IS NULL OR color = '';

-- Add comment to document the change
COMMENT ON COLUMN task_groups.color IS 'Color value - supports hex codes and CSS variables';