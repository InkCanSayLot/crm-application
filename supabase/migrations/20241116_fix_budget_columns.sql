-- Fix budget table column names to match API expectations
ALTER TABLE budgets 
RENAME COLUMN amount TO total_amount;

ALTER TABLE budgets 
RENAME COLUMN period TO budget_period;

-- Add missing columns to payments table if they don't exist
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS currency varchar(3) DEFAULT 'USD';

-- Update existing data to have proper currency values
UPDATE payments SET currency = 'USD' WHERE currency IS NULL;