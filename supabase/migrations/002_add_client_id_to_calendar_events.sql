-- Add client_id field to calendar_events table to link events with clients

ALTER TABLE calendar_events 
ADD COLUMN client_id UUID REFERENCES clients(id);

-- Create index for better performance
CREATE INDEX idx_calendar_events_client_id ON calendar_events(client_id);

-- Update permissions
GRANT SELECT ON calendar_events TO anon;
GRANT ALL PRIVILEGES ON calendar_events TO authenticated;