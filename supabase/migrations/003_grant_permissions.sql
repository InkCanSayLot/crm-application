-- Grant permissions to anon and authenticated roles for all tables

-- Grant permissions for clients table
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO authenticated;

-- Grant permissions for users table
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;

-- Grant permissions for tasks table
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;

-- Grant permissions for calendar_events table
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO authenticated;

-- Grant permissions for interactions table
GRANT SELECT, INSERT, UPDATE, DELETE ON interactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON interactions TO authenticated;

-- Grant permissions for journal_entries table
GRANT SELECT, INSERT, UPDATE, DELETE ON journal_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON journal_entries TO authenticated;

-- Grant permissions for meeting_notes table
GRANT SELECT, INSERT, UPDATE, DELETE ON meeting_notes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON meeting_notes TO authenticated;

-- Grant permissions for ai_optimizations table
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_optimizations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_optimizations TO authenticated;

-- Grant usage on sequences (for auto-generated IDs)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;