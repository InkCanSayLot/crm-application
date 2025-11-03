-- Add missing phone column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Update existing users with NULL phone values to empty string if needed
UPDATE users SET phone = '' WHERE phone IS NULL;

-- Grant permissions for the phone column
GRANT SELECT, INSERT, UPDATE ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Create or replace function to handle UUID validation
CREATE OR REPLACE FUNCTION validate_uuid_or_null(input_text TEXT)
RETURNS UUID AS $$
BEGIN
  -- Return NULL if input is empty string or NULL
  IF input_text IS NULL OR input_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- Try to cast to UUID, return NULL if invalid
  BEGIN
    RETURN input_text::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql;

-- Update any existing empty string UUIDs to NULL in relevant tables
UPDATE clients SET assigned_to = NULL WHERE assigned_to::TEXT = '';
UPDATE calendar_events SET created_by = NULL WHERE created_by::TEXT = '';
UPDATE calendar_events SET user_id = NULL WHERE user_id::TEXT = '';
UPDATE tasks SET assigned_to = NULL WHERE assigned_to::TEXT = '';
UPDATE journal_entries SET user_id = NULL WHERE user_id::TEXT = '';

-- Add check constraints to prevent empty string UUIDs in the future
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_assigned_to_not_empty;
ALTER TABLE clients ADD CONSTRAINT clients_assigned_to_not_empty 
  CHECK (assigned_to IS NULL OR assigned_to::TEXT != '');

ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_created_by_not_empty;
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_created_by_not_empty 
  CHECK (created_by IS NULL OR created_by::TEXT != '');

ALTER TABLE calendar_events DROP CONSTRAINT IF EXISTS calendar_events_user_id_not_empty;
ALTER TABLE calendar_events ADD CONSTRAINT calendar_events_user_id_not_empty 
  CHECK (user_id IS NULL OR user_id::TEXT != '');

ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_assigned_to_not_empty;
ALTER TABLE tasks ADD CONSTRAINT tasks_assigned_to_not_empty 
  CHECK (assigned_to IS NULL OR assigned_to::TEXT != '');

ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_user_id_not_empty;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_user_id_not_empty 
  CHECK (user_id IS NULL OR user_id::TEXT != '');

-- Ensure RLS policies are properly set
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create comprehensive RLS policies for users table
CREATE POLICY "Users can view all users" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Grant necessary permissions
GRANT SELECT ON users TO anon;
GRANT ALL PRIVILEGES ON users TO authenticated;

-- Add comment for tracking
COMMENT ON COLUMN users.phone IS 'User phone number - added to fix production schema issues';