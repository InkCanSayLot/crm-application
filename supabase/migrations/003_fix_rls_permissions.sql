-- Fix RLS permissions for anon and authenticated roles
-- First, grant basic permissions to roles
GRANT SELECT ON clients TO anon;
GRANT SELECT ON tasks TO anon;
GRANT SELECT ON calendar_events TO anon;
GRANT SELECT ON users TO anon;
GRANT SELECT ON interactions TO anon;
GRANT SELECT ON journal_entries TO anon;
GRANT SELECT ON meeting_notes TO anon;
GRANT SELECT ON ai_optimizations TO anon;

-- Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON clients TO authenticated;
GRANT ALL PRIVILEGES ON tasks TO authenticated;
GRANT ALL PRIVILEGES ON calendar_events TO authenticated;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON interactions TO authenticated;
GRANT ALL PRIVILEGES ON journal_entries TO authenticated;
GRANT ALL PRIVILEGES ON meeting_notes TO authenticated;
GRANT ALL PRIVILEGES ON ai_optimizations TO authenticated;

-- Drop existing policies if they exist (ignore errors)
DO $$ 
BEGIN
    -- Drop clients policies
    DROP POLICY IF EXISTS "Users can view all clients" ON clients;
    DROP POLICY IF EXISTS "Users can insert clients" ON clients;
    DROP POLICY IF EXISTS "Users can update clients" ON clients;
    DROP POLICY IF EXISTS "Users can delete clients" ON clients;
    DROP POLICY IF EXISTS "Allow anon read access to clients" ON clients;
    
    -- Drop tasks policies
    DROP POLICY IF EXISTS "Users can view all tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can insert tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can update tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can delete tasks" ON tasks;
    DROP POLICY IF EXISTS "Allow anon read access to tasks" ON tasks;
    
    -- Drop calendar events policies
    DROP POLICY IF EXISTS "Users can view all calendar events" ON calendar_events;
    DROP POLICY IF EXISTS "Users can insert calendar events" ON calendar_events;
    DROP POLICY IF EXISTS "Users can update calendar events" ON calendar_events;
    DROP POLICY IF EXISTS "Users can delete calendar events" ON calendar_events;
    DROP POLICY IF EXISTS "Allow anon read access to calendar events" ON calendar_events;
    
    -- Drop users policies
    DROP POLICY IF EXISTS "Users can view all users" ON users;
    DROP POLICY IF EXISTS "Users can insert users" ON users;
    DROP POLICY IF EXISTS "Users can update users" ON users;
    DROP POLICY IF EXISTS "Allow anon read access to users" ON users;
    
    -- Drop other table policies
    DROP POLICY IF EXISTS "Users can view all interactions" ON interactions;
    DROP POLICY IF EXISTS "Users can insert interactions" ON interactions;
    DROP POLICY IF EXISTS "Users can update interactions" ON interactions;
    DROP POLICY IF EXISTS "Users can delete interactions" ON interactions;
    
    DROP POLICY IF EXISTS "Users can view all journal entries" ON journal_entries;
    DROP POLICY IF EXISTS "Users can insert journal entries" ON journal_entries;
    DROP POLICY IF EXISTS "Users can update journal entries" ON journal_entries;
    DROP POLICY IF EXISTS "Users can delete journal entries" ON journal_entries;
    
    DROP POLICY IF EXISTS "Users can view all meeting notes" ON meeting_notes;
    DROP POLICY IF EXISTS "Users can insert meeting notes" ON meeting_notes;
    DROP POLICY IF EXISTS "Users can update meeting notes" ON meeting_notes;
    DROP POLICY IF EXISTS "Users can delete meeting notes" ON meeting_notes;
    
    DROP POLICY IF EXISTS "Users can view all ai optimizations" ON ai_optimizations;
    DROP POLICY IF EXISTS "Users can insert ai optimizations" ON ai_optimizations;
    DROP POLICY IF EXISTS "Users can update ai optimizations" ON ai_optimizations;
    DROP POLICY IF EXISTS "Users can delete ai optimizations" ON ai_optimizations;
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors when dropping policies
        NULL;
END $$;

-- Create new RLS policies
-- Clients policies
CREATE POLICY "Users can view all clients" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert clients" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update clients" ON clients FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete clients" ON clients FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow anon read access to clients" ON clients FOR SELECT TO anon USING (true);

-- Tasks policies
CREATE POLICY "Users can view all tasks" ON tasks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update tasks" ON tasks FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete tasks" ON tasks FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow anon read access to tasks" ON tasks FOR SELECT TO anon USING (true);

-- Calendar events policies
CREATE POLICY "Users can view all calendar events" ON calendar_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert calendar events" ON calendar_events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update calendar events" ON calendar_events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete calendar events" ON calendar_events FOR DELETE TO authenticated USING (true);
CREATE POLICY "Allow anon read access to calendar events" ON calendar_events FOR SELECT TO anon USING (true);

-- Users policies
CREATE POLICY "Users can view all users" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert users" ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update users" ON users FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Allow anon read access to users" ON users FOR SELECT TO anon USING (true);

-- Interactions policies
CREATE POLICY "Users can view all interactions" ON interactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert interactions" ON interactions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update interactions" ON interactions FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete interactions" ON interactions FOR DELETE TO authenticated USING (true);

-- Journal entries policies
CREATE POLICY "Users can view all journal entries" ON journal_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert journal entries" ON journal_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update journal entries" ON journal_entries FOR UPDATE to authenticated USING (true);
CREATE POLICY "Users can delete journal entries" ON journal_entries FOR DELETE TO authenticated USING (true);

-- Meeting notes policies
CREATE POLICY "Users can view all meeting notes" ON meeting_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert meeting notes" ON meeting_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update meeting notes" ON meeting_notes FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete meeting notes" ON meeting_notes FOR DELETE TO authenticated USING (true);

-- AI optimizations policies
CREATE POLICY "Users can view all ai optimizations" ON ai_optimizations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert ai optimizations" ON ai_optimizations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Users can update ai optimizations" ON ai_optimizations FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete ai optimizations" ON ai_optimizations FOR DELETE TO authenticated USING (true);