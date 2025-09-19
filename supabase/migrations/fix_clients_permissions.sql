-- Grant permissions to clients table
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;
GRANT SELECT ON clients TO anon;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all clients" ON clients;
DROP POLICY IF EXISTS "Users can insert clients" ON clients;
DROP POLICY IF EXISTS "Users can update clients" ON clients;
DROP POLICY IF EXISTS "Users can delete clients" ON clients;

-- Create RLS policies for clients table
CREATE POLICY "Users can view all clients" ON clients
    FOR SELECT USING (true);

CREATE POLICY "Users can insert clients" ON clients
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update clients" ON clients
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete clients" ON clients
    FOR DELETE USING (true);

-- Also grant permissions to other related tables
GRANT SELECT, INSERT, UPDATE, DELETE ON interactions TO authenticated;
GRANT SELECT ON interactions TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT ON tasks TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO authenticated;
GRANT SELECT ON calendar_events TO anon;

-- Create policies for interactions table
DROP POLICY IF EXISTS "Users can manage interactions" ON interactions;
CREATE POLICY "Users can manage interactions" ON interactions
    FOR ALL USING (true);

-- Create policies for tasks table
DROP POLICY IF EXISTS "Users can manage tasks" ON tasks;
CREATE POLICY "Users can manage tasks" ON tasks
    FOR ALL USING (true);

-- Create policies for calendar_events table
DROP POLICY IF EXISTS "Users can manage calendar events" ON calendar_events;
CREATE POLICY "Users can manage calendar events" ON calendar_events
    FOR ALL USING (true);