-- Add last_contact_note field to clients table
-- This field is used for lead tracking to store notes about the last contact

ALTER TABLE clients 
ADD COLUMN last_contact_note TEXT;

-- Add index for the new field
CREATE INDEX idx_clients_last_contact_note ON clients(last_contact_note);

-- Add comment for documentation
COMMENT ON COLUMN clients.last_contact_note IS 'Text note about the last contact with this client (especially useful for leads)';

-- Grant permissions for the new column
GRANT SELECT, INSERT, UPDATE ON clients TO authenticated;
GRANT SELECT ON clients TO anon;