-- Grant permissions to anon and authenticated roles for existing tables

-- Grant SELECT permissions to anon role (for public read access)
GRANT SELECT ON clients TO anon;
GRANT SELECT ON calendar_events TO anon;
GRANT SELECT ON chat_messages TO anon;
GRANT SELECT ON tasks TO anon;
GRANT SELECT ON users TO anon;
GRANT SELECT ON journal_entries TO anon;
GRANT SELECT ON chat_rooms TO anon;

-- Grant full permissions to authenticated role
GRANT ALL PRIVILEGES ON clients TO authenticated;
GRANT ALL PRIVILEGES ON calendar_events TO authenticated;
GRANT ALL PRIVILEGES ON chat_messages TO authenticated;
GRANT ALL PRIVILEGES ON tasks TO authenticated;
GRANT ALL PRIVILEGES ON users TO authenticated;
GRANT ALL PRIVILEGES ON journal_entries TO authenticated;
GRANT ALL PRIVILEGES ON chat_rooms TO authenticated;

-- Grant usage on sequences to authenticated role
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;