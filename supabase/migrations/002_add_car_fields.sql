-- Add number_of_cars and commitment_length fields to clients table
-- This migration supports William's requirement for car-based deal calculation

ALTER TABLE clients 
ADD COLUMN number_of_cars INTEGER DEFAULT 1,
ADD COLUMN commitment_length INTEGER DEFAULT 12 CHECK (commitment_length IN (12, 24, 36)),
ADD COLUMN last_contact TIMESTAMP WITH TIME ZONE;

-- Add indexes for the new fields
CREATE INDEX idx_clients_number_of_cars ON clients(number_of_cars);
CREATE INDEX idx_clients_commitment_length ON clients(commitment_length);
CREATE INDEX idx_clients_last_contact ON clients(last_contact DESC);

-- Update existing clients with default values
UPDATE clients SET 
  number_of_cars = 1,
  commitment_length = 12,
  last_contact = created_at
WHERE number_of_cars IS NULL OR commitment_length IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN clients.number_of_cars IS 'Number of cars in the deal (used for calculation: (335 * cars + 96) * commitment_length)';
COMMENT ON COLUMN clients.commitment_length IS 'Commitment period in months (12, 24, or 36)';
COMMENT ON COLUMN clients.last_contact IS 'Timestamp of last contact with this client';