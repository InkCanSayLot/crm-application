-- Add user_id column to calendar_events table for data separation

ALTER TABLE calendar_events ADD COLUMN user_id UUID REFERENCES users(id);

-- Add index for the new field
CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);

-- Grant permissions for the new column
GRANT SELECT, INSERT, UPDATE ON calendar_events TO authenticated;
GRANT SELECT ON calendar_events TO anon;

-- Add comment for documentation
COMMENT ON COLUMN calendar_events.user_id IS 'User who created/owns this calendar event (for personal vs shared events)';