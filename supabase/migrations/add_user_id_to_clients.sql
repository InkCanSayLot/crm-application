-- Add user_id column to clients table
ALTER TABLE clients ADD COLUMN user_id UUID REFERENCES users(id);

-- Add index for the new field
CREATE INDEX idx_clients_user_id ON clients(user_id);

-- Grant permissions for the new column
GRANT SELECT, INSERT, UPDATE ON clients TO authenticated;
GRANT SELECT ON clients TO anon;

-- Add comment for documentation
COMMENT ON COLUMN clients.user_id IS 'User who created/owns this client record';