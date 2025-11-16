-- Create financial management tables for budget, payments, expenses, and vendors

-- Vendors table (create first since expenses references it)
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    website TEXT,
    tax_id VARCHAR(100),
    payment_terms VARCHAR(100),
    category VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets table
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    name VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    period VARCHAR(20) DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    category VARCHAR(100),
    description TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    budget_id UUID REFERENCES budgets(id),
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'credit_card', 'paypal', 'check', 'cash')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    description TEXT,
    reference_number VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    budget_id UUID REFERENCES budgets(id),
    vendor_id UUID REFERENCES vendors(id),
    amount DECIMAL(10,2) NOT NULL,
    expense_date DATE NOT NULL,
    category VARCHAR(100),
    description TEXT,
    receipt_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_budgets_client_id ON budgets(client_id);
CREATE INDEX idx_budgets_created_by ON budgets(created_by);
CREATE INDEX idx_budgets_period ON budgets(period);
CREATE INDEX idx_budgets_date_range ON budgets(start_date, end_date);

CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_budget_id ON payments(budget_id);
CREATE INDEX idx_payments_created_by ON payments(created_by);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_expenses_client_id ON expenses(client_id);
CREATE INDEX idx_expenses_budget_id ON expenses(budget_id);
CREATE INDEX idx_expenses_vendor_id ON expenses(vendor_id);
CREATE INDEX idx_expenses_created_by ON expenses(created_by);
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_status ON expenses(status);

CREATE INDEX idx_vendors_created_by ON vendors(created_by);
CREATE INDEX idx_vendors_category ON vendors(category);
CREATE INDEX idx_vendors_status ON vendors(status);

-- Enable RLS
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all budgets" ON budgets FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage budgets" ON budgets FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view all payments" ON payments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage payments" ON payments FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view all expenses" ON expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage expenses" ON expenses FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view all vendors" ON vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can manage vendors" ON vendors FOR ALL TO authenticated USING (true);

-- Grant permissions
GRANT SELECT ON budgets TO anon;
GRANT ALL PRIVILEGES ON budgets TO authenticated;

GRANT SELECT ON payments TO anon;
GRANT ALL PRIVILEGES ON payments TO authenticated;

GRANT SELECT ON expenses TO anon;
GRANT ALL PRIVILEGES ON expenses TO authenticated;

GRANT SELECT ON vendors TO anon;
GRANT ALL PRIVILEGES ON vendors TO authenticated;