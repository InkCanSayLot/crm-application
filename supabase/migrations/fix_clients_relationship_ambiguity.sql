-- Fix relationship ambiguity between clients and users tables
-- Ensure only one clear relationship exists

-- Drop any existing user_id foreign key constraint if it exists
ALTER TABLE clients DROP CONSTRAINT IF EXISTS clients_user_id_fkey;

-- Drop the user_id column if it exists
ALTER TABLE clients DROP COLUMN IF EXISTS user_id;

-- Ensure RLS policies use assigned_to for consistency
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

-- Ensure permissions are granted
GRANT ALL PRIVILEGES ON clients TO authenticated;
GRANT SELECT ON clients TO anon;