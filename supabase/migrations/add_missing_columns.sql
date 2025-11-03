-- Add missing columns to existing tables

-- Add notes column to clients table
ALTER TABLE clients ADD COLUMN notes TEXT;

-- Add location column to calendar_events table
ALTER TABLE calendar_events ADD COLUMN location TEXT;

-- Add content column to journal_entries table
ALTER TABLE journal_entries ADD COLUMN content TEXT;

-- Grant permissions for the new columns
GRANT SELECT, INSERT, UPDATE ON clients TO authenticated;
GRANT SELECT, INSERT, UPDATE ON calendar_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON journal_entries TO authenticated;

GRANT SELECT ON clients TO anon;
GRANT SELECT ON calendar_events TO anon;
GRANT SELECT ON journal_entries TO anon;