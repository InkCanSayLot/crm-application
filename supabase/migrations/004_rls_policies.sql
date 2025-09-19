-- Create RLS policies to allow access to data

-- Policies for clients table
CREATE POLICY "Allow all operations on clients" ON clients
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for users table
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for tasks table
CREATE POLICY "Allow all operations on tasks" ON tasks
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for calendar_events table
CREATE POLICY "Allow all operations on calendar_events" ON calendar_events
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for interactions table
CREATE POLICY "Allow all operations on interactions" ON interactions
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for journal_entries table
CREATE POLICY "Allow all operations on journal_entries" ON journal_entries
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for meeting_notes table
CREATE POLICY "Allow all operations on meeting_notes" ON meeting_notes
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for ai_optimizations table
CREATE POLICY "Allow all operations on ai_optimizations" ON ai_optimizations
  FOR ALL USING (true) WITH CHECK (true);