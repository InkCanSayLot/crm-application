-- Add missing title and category columns to journal_entries table
ALTER TABLE journal_entries 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add comments for the new columns
COMMENT ON COLUMN journal_entries.title IS 'Title of the journal entry';
COMMENT ON COLUMN journal_entries.category IS 'Category of the journal entry';