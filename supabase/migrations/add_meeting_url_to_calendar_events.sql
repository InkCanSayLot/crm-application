-- Add meeting_url column to calendar_events table for virtual meetings

ALTER TABLE calendar_events ADD COLUMN meeting_url TEXT;

-- Grant permissions for the new column
GRANT SELECT, INSERT, UPDATE ON calendar_events TO authenticated;
GRANT SELECT ON calendar_events TO anon;

-- Add comment for documentation
COMMENT ON COLUMN calendar_events.meeting_url IS 'URL for virtual meetings (Zoom, Teams, etc.)';