-- Add per_car_value and setup_fee fields to clients table
-- This migration supports editable deal value calculation formula

ALTER TABLE clients 
ADD COLUMN per_car_value DECIMAL(10,2) DEFAULT 335.00,
ADD COLUMN setup_fee DECIMAL(10,2) DEFAULT 96.00;

-- Add indexes for the new fields
CREATE INDEX idx_clients_per_car_value ON clients(per_car_value);
CREATE INDEX idx_clients_setup_fee ON clients(setup_fee);

-- Update existing clients with default values
UPDATE clients SET 
  per_car_value = 335.00,
  setup_fee = 96.00
WHERE per_car_value IS NULL OR setup_fee IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN clients.per_car_value IS 'Per car value used in deal calculation formula';
COMMENT ON COLUMN clients.setup_fee IS 'Setup fee used in deal calculation formula';