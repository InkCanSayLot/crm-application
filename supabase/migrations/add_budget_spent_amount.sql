-- Add spent_amount column to budgets table for tracking actual spending

ALTER TABLE budgets ADD COLUMN spent_amount DECIMAL(10,2) DEFAULT 0.00;

-- Add index for the new field
CREATE INDEX idx_budgets_spent_amount ON budgets(spent_amount);

-- Grant permissions for the updated table
GRANT SELECT, INSERT, UPDATE ON budgets TO authenticated;
GRANT SELECT ON budgets TO anon;

-- Add comment for documentation
COMMENT ON COLUMN budgets.spent_amount IS 'Actual amount spent against this budget';