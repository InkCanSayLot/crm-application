-- Add client_id column to calendar_events table for linking events to clients

ALTER TABLE calendar_events ADD COLUMN client_id UUID REFERENCES clients(id);

-- Add index for the new field
CREATE INDEX idx_calendar_events_client_id ON calendar_events(client_id);

-- Grant permissions for the new column
GRANT SELECT, INSERT, UPDATE ON calendar_events TO authenticated;
GRANT SELECT ON calendar_events TO anon;

-- Add comment for documentation
COMMENT ON COLUMN calendar_events.client_id IS 'Client associated with this calendar event';