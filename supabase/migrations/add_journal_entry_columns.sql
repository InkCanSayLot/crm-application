-- Add missing columns to journal_entries table for enhanced journal functionality

-- Add title column
ALTER TABLE journal_entries ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Journal Entry';

-- Add mood column
ALTER TABLE journal_entries ADD COLUMN mood VARCHAR(50) DEFAULT 'neutral';

-- Add category column
ALTER TABLE journal_entries ADD COLUMN category VARCHAR(50) DEFAULT 'general';

-- Add tags column (as array or JSON)
ALTER TABLE journal_entries ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Grant permissions for the new columns
GRANT SELECT, INSERT, UPDATE ON journal_entries TO authenticated;
GRANT SELECT ON journal_entries TO anon;

-- Add comments for documentation
COMMENT ON COLUMN journal_entries.title IS 'Title of the journal entry';
COMMENT ON COLUMN journal_entries.mood IS 'User mood when creating the entry';
COMMENT ON COLUMN journal_entries.category IS 'Category of the journal entry';
COMMENT ON COLUMN journal_entries.tags IS 'Array of tags for the journal entry';