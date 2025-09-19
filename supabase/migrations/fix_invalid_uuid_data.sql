-- Fix invalid UUID data that causes 'invalid input syntax for type uuid: "1"' errors
-- This migration identifies and fixes any invalid UUID values in foreign key fields

-- First, let's check for invalid UUIDs in the tasks.assigned_to field
-- and set them to NULL if they're not valid UUIDs
UPDATE tasks 
SET assigned_to = NULL 
WHERE assigned_to IS NOT NULL 
AND assigned_to::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Fix invalid UUIDs in the clients.assigned_to field
UPDATE clients 
SET assigned_to = NULL 
WHERE assigned_to IS NOT NULL 
AND assigned_to::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Fix invalid UUIDs in the tasks.client_id field
UPDATE tasks 
SET client_id = NULL 
WHERE client_id IS NOT NULL 
AND client_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Fix invalid UUIDs in the calendar_events.client_id field
UPDATE calendar_events 
SET client_id = NULL 
WHERE client_id IS NOT NULL 
AND client_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Fix invalid UUIDs in the calendar_events.created_by field
UPDATE calendar_events 
SET created_by = NULL 
WHERE created_by IS NOT NULL 
AND created_by::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Fix invalid UUIDs in the journal_entries.user_id field
UPDATE journal_entries 
SET user_id = NULL 
WHERE user_id IS NOT NULL 
AND user_id::text !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

-- Add comments for tracking
COMMENT ON TABLE tasks IS 'Fixed invalid UUID data';
COMMENT ON TABLE clients IS 'Fixed invalid UUID data';
COMMENT ON TABLE calendar_events IS 'Fixed invalid UUID data';
COMMENT ON TABLE journal_entries IS 'Fixed invalid UUID data';