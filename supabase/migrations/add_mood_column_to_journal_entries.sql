-- Add mood column to journal_entries table
ALTER TABLE journal_entries ADD COLUMN mood TEXT;

-- Add comment to the column
COMMENT ON COLUMN journal_entries.mood IS 'User mood for the journal entry';