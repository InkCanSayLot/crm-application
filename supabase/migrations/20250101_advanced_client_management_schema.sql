-- Advanced Client Management System Database Schema
-- This migration adds financial management tables to the existing CRM structure

-- Create client_contracts table
CREATE TABLE IF NOT EXISTS client_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    contract_name VARCHAR(255) NOT NULL,
    contract_type VARCHAR(50) DEFAULT 'service' CHECK (contract_type IN ('service', 'product', 'retainer', 'project')),
    start_date DATE NOT NULL,
    end_date DATE,
    contract_value DECIMAL(15,2),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create client_interactions table (enhanced version of existing interactions)
CREATE TABLE IF NOT EXISTS client_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('call', 'email', 'meeting', 'proposal', 'follow_up', 'contract_discussion')),
    subject VARCHAR(255),
    description TEXT,
    outcome VARCHAR(100),
    next_action VARCHAR(255),
    interaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    budget_name VARCHAR(255) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - spent_amount) STORED,
    budget_period VARCHAR(50) DEFAULT 'monthly' CHECK (budget_period IN ('weekly', 'monthly', 'quarterly', 'yearly', 'project')),
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'exceeded')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    vendor_type VARCHAR(100),
    payment_terms VARCHAR(100),
    tax_id VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
    payment_type VARCHAR(50) DEFAULT 'received' CHECK (payment_type IN ('received', 'sent')),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    payment_method VARCHAR(50) DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'credit_card', 'paypal', 'stripe', 'cash', 'check')),
    payment_date DATE NOT NULL,
    description TEXT,
    invoice_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    budget_id UUID REFERENCES budgets(id) ON DELETE SET NULL,
    vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
    expense_category VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    expense_date DATE NOT NULL,
    description TEXT NOT NULL,
    receipt_url TEXT,
    status VARCHAR(50) DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create client_analytics table
CREATE TABLE IF NOT EXISTS client_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,2),
    metric_date DATE NOT NULL,
    calculation_period VARCHAR(50) DEFAULT 'monthly' CHECK (calculation_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create financial_reports table
CREATE TABLE IF NOT EXISTS financial_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL CHECK (report_type IN ('revenue', 'expenses', 'profit_loss', 'client_profitability', 'budget_analysis')),
    report_data JSONB NOT NULL,
    report_period_start DATE,
    report_period_end DATE,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_contracts_client_id ON client_contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_client_contracts_status ON client_contracts(status);
CREATE INDEX IF NOT EXISTS idx_client_interactions_client_id ON client_interactions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_interactions_date ON client_interactions(interaction_date);
CREATE INDEX IF NOT EXISTS idx_budgets_client_id ON budgets(client_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_payments_client_id ON payments(client_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_client_id ON expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_expenses_budget_id ON expenses(budget_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_client_analytics_client_id ON client_analytics(client_id);
CREATE INDEX IF NOT EXISTS idx_client_analytics_date ON client_analytics(metric_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_financial_reports_type ON financial_reports(report_type);

-- Enable Row Level Security (RLS)
ALTER TABLE client_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for authenticated users for now)
CREATE POLICY "Allow all operations for authenticated users" ON client_contracts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON client_interactions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON budgets FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON vendors FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON client_analytics FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON audit_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON financial_reports FOR ALL TO authenticated USING (true);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON client_contracts TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON client_interactions TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON budgets TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON vendors TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON payments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON expenses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON client_analytics TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_reports TO anon, authenticated;

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_client_contracts_updated_at BEFORE UPDATE ON client_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update budget spent amount
CREATE OR REPLACE FUNCTION update_budget_spent_amount()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE budgets 
        SET spent_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM expenses 
            WHERE budget_id = NEW.budget_id AND status = 'approved'
        )
        WHERE id = NEW.budget_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE budgets 
        SET spent_amount = (
            SELECT COALESCE(SUM(amount), 0) 
            FROM expenses 
            WHERE budget_id = OLD.budget_id AND status = 'approved'
        )
        WHERE id = OLD.budget_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update budget spent amount
CREATE TRIGGER update_budget_spent_trigger
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_budget_spent_amount();

-- Create function to calculate client profitability
CREATE OR REPLACE FUNCTION calculate_client_profitability(client_uuid UUID, start_date DATE, end_date DATE)
RETURNS TABLE(
    client_id UUID,
    total_revenue DECIMAL(15,2),
    total_expenses DECIMAL(15,2),
    net_profit DECIMAL(15,2),
    profit_margin DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        client_uuid as client_id,
        COALESCE(revenue.total, 0) as total_revenue,
        COALESCE(expenses.total, 0) as total_expenses,
        COALESCE(revenue.total, 0) - COALESCE(expenses.total, 0) as net_profit,
        CASE 
            WHEN COALESCE(revenue.total, 0) > 0 
            THEN ((COALESCE(revenue.total, 0) - COALESCE(expenses.total, 0)) / revenue.total * 100)::DECIMAL(5,2)
            ELSE 0::DECIMAL(5,2)
        END as profit_margin
    FROM (
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments 
        WHERE client_id = client_uuid 
        AND payment_type = 'received' 
        AND payment_date BETWEEN start_date AND end_date
        AND status = 'completed'
    ) revenue
    CROSS JOIN (
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses 
        WHERE client_id = client_uuid 
        AND expense_date BETWEEN start_date AND end_date
        AND status = 'approved'
    ) expenses;
END;
$$ language 'plpgsql';

-- Insert sample data for vendors
INSERT INTO vendors (vendor_name, contact_person, email, phone, vendor_type, payment_terms, status) VALUES
('Tech Solutions Inc', 'John Smith', 'john@techsolutions.com', '+1-555-0101', 'Technology', 'Net 30', 'active'),
('Marketing Pro', 'Sarah Johnson', 'sarah@marketingpro.com', '+1-555-0102', 'Marketing', 'Net 15', 'active'),
('Office Supplies Co', 'Mike Wilson', 'mike@officesupplies.com', '+1-555-0103', 'Office Supplies', 'Net 30', 'active')
ON CONFLICT DO NOTHING;

-- Insert sample data for existing clients (if any exist)
DO $$
DECLARE
    client_record RECORD;
    budget_id UUID;
BEGIN
    -- Get first client if exists
    SELECT * INTO client_record FROM clients LIMIT 1;
    
    IF FOUND THEN
        -- Insert sample budget
        INSERT INTO budgets (client_id, budget_name, total_amount, budget_period, start_date, end_date, status)
        VALUES (client_record.id, 'Q1 2024 Marketing Budget', 50000.00, 'quarterly', '2024-01-01', '2024-03-31', 'active')
        RETURNING id INTO budget_id;
        
        -- Insert sample payments
        INSERT INTO payments (client_id, budget_id, payment_type, amount, payment_method, payment_date, description, status) VALUES
        (client_record.id, budget_id, 'received', 25000.00, 'bank_transfer', '2024-01-15', 'Initial project payment', 'completed'),
        (client_record.id, budget_id, 'received', 15000.00, 'stripe', '2024-02-15', 'Milestone payment', 'completed');
        
        -- Insert sample expenses
        INSERT INTO expenses (client_id, budget_id, expense_category, amount, expense_date, description, status) VALUES
        (client_record.id, budget_id, 'Marketing', 5000.00, '2024-01-20', 'Digital advertising campaign', 'approved'),
        (client_record.id, budget_id, 'Technology', 3000.00, '2024-02-01', 'Software licenses', 'approved');
    END IF;
END $$;

-- Create a view for client financial summary
CREATE OR REPLACE VIEW client_financial_summary AS
SELECT 
    c.id,
    c.company_name,
    c.contact_name,
    c.stage,
    COALESCE(revenue.total_revenue, 0) as total_revenue,
    COALESCE(expenses.total_expenses, 0) as total_expenses,
    COALESCE(revenue.total_revenue, 0) - COALESCE(expenses.total_expenses, 0) as net_profit,
    CASE 
        WHEN COALESCE(revenue.total_revenue, 0) > 0 
        THEN ((COALESCE(revenue.total_revenue, 0) - COALESCE(expenses.total_expenses, 0)) / revenue.total_revenue * 100)::DECIMAL(5,2)
        ELSE 0::DECIMAL(5,2)
    END as profit_margin,
    budgets.active_budgets,
    budgets.total_budget_amount
FROM clients c
LEFT JOIN (
    SELECT 
        client_id,
        SUM(amount) as total_revenue
    FROM payments 
    WHERE payment_type = 'received' AND status = 'completed'
    GROUP BY client_id
) revenue ON c.id = revenue.client_id
LEFT JOIN (
    SELECT 
        client_id,
        SUM(amount) as total_expenses
    FROM expenses 
    WHERE status = 'approved'
    GROUP BY client_id
) expenses ON c.id = expenses.client_id
LEFT JOIN (
    SELECT 
        client_id,
        COUNT(*) as active_budgets,
        SUM(total_amount) as total_budget_amount
    FROM budgets 
    WHERE status = 'active'
    GROUP BY client_id
) budgets ON c.id = budgets.client_id;

-- Grant access to the view
GRANT SELECT ON client_financial_summary TO anon, authenticated;