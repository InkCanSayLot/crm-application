-- Add missing 'updated_at' column to calendar_events table
ALTER TABLE calendar_events ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON calendar_events TO authenticated;

-- Update existing records with current timestamp
UPDATE calendar_events SET updated_at = now() WHERE updated_at IS NULL;

-- Create trigger to automatically update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON calendar_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();