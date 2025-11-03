-- Fix duplicate foreign key relationships between clients and users tables
-- Remove the user_id foreign key constraint and keep assigned_to as the primary relationship

-- Drop the user_id foreign key constraint
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;

-- Update RLS policies to use assigned_to instead of user_id for consistency
DROP POLICY IF EXISTS "Users can only see their own clients" ON clients;
DROP POLICY IF EXISTS "Users can only insert their own clients" ON clients;
DROP POLICY IF EXISTS "Users can only update their own clients" ON clients;
DROP POLICY IF EXISTS "Users can only delete their own clients" ON clients;

-- Create new RLS policies using assigned_to
CREATE POLICY "Users can only see their own clients" ON clients
    FOR SELECT USING (assigned_to = auth.uid());

CREATE POLICY "Users can only insert their own clients" ON clients
    FOR INSERT WITH CHECK (assigned_to = auth.uid());

CREATE POLICY "Users can only update their own clients" ON clients
    FOR UPDATE USING (assigned_to = auth.uid());

CREATE POLICY "Users can only delete their own clients" ON clients
    FOR DELETE USING (assigned_to = auth.uid());

-- Update any existing data where user_id is set but assigned_to is null
UPDATE clients 
SET assigned_to = user_id 
WHERE assigned_to IS NULL AND user_id IS NOT NULL;

-- Remove the user_id column since we're using assigned_to for the relationship
ALTER TABLE clients DROP COLUMN IF EXISTS user_id;

-- Ensure permissions are still granted
GRANT ALL PRIVILEGES ON clients TO authenticated;
GRANT SELECT ON clients TO anon;