-- Create client_financial_summary table for financial analytics
CREATE TABLE IF NOT EXISTS public.client_financial_summary (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    total_revenue NUMERIC DEFAULT 0.00,
    total_expenses NUMERIC DEFAULT 0.00,
    net_profit NUMERIC DEFAULT 0.00,
    profit_margin NUMERIC DEFAULT 0.00,
    total_payments NUMERIC DEFAULT 0.00,
    total_budgets NUMERIC DEFAULT 0.00,
    budget_utilization NUMERIC DEFAULT 0.00,
    average_monthly_revenue NUMERIC DEFAULT 0.00,
    last_payment_date DATE,
    last_expense_date DATE,
    payment_count INTEGER DEFAULT 0,
    expense_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_client_financial_summary_client_id ON public.client_financial_summary(client_id);
CREATE INDEX IF NOT EXISTS idx_client_financial_summary_updated_at ON public.client_financial_summary(updated_at);

-- Enable RLS
ALTER TABLE public.client_financial_summary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own client financial summaries" ON public.client_financial_summary
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE clients.id = client_financial_summary.client_id 
            AND (clients.user_id = auth.uid() OR clients.assigned_to = auth.uid())
        )
    );

CREATE POLICY "Users can update their own client financial summaries" ON public.client_financial_summary
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE clients.id = client_financial_summary.client_id 
            AND (clients.user_id = auth.uid() OR clients.assigned_to = auth.uid())
        )
    );

CREATE POLICY "Users can insert their own client financial summaries" ON public.client_financial_summary
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE clients.id = client_financial_summary.client_id 
            AND (clients.user_id = auth.uid() OR clients.assigned_to = auth.uid())
        )
    );

CREATE POLICY "Users can delete their own client financial summaries" ON public.client_financial_summary
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.clients 
            WHERE clients.id = client_financial_summary.client_id 
            AND (clients.user_id = auth.uid() OR clients.assigned_to = auth.uid())
        )
    );

-- Grant permissions
GRANT SELECT ON public.client_financial_summary TO anon, authenticated;
GRANT INSERT ON public.client_financial_summary TO anon, authenticated;
GRANT UPDATE ON public.client_financial_summary TO anon, authenticated;
GRANT DELETE ON public.client_financial_summary TO anon, authenticated;

-- Create function to update client financial summary
CREATE OR REPLACE FUNCTION public.update_client_financial_summary(target_client_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Insert or update financial summary for the client
    INSERT INTO public.client_financial_summary (
        client_id,
        total_revenue,
        total_expenses,
        net_profit,
        profit_margin,
        total_payments,
        total_budgets,
        budget_utilization,
        average_monthly_revenue,
        last_payment_date,
        last_expense_date,
        payment_count,
        expense_count,
        updated_at
    )
    SELECT 
        c.id as client_id,
        COALESCE(SUM(p.amount), 0.00) as total_revenue,
        COALESCE(SUM(e.amount), 0.00) as total_expenses,
        COALESCE(SUM(p.amount), 0.00) - COALESCE(SUM(e.amount), 0.00) as net_profit,
        CASE 
            WHEN COALESCE(SUM(p.amount), 0.00) > 0 
            THEN ROUND(((COALESCE(SUM(p.amount), 0.00) - COALESCE(SUM(e.amount), 0.00)) / SUM(p.amount) * 100), 2)
            ELSE 0.00
        END as profit_margin,
        COALESCE(SUM(p.amount), 0.00) as total_payments,
        COALESCE(SUM(b.amount), 0.00) as total_budgets,
        CASE 
            WHEN COALESCE(SUM(b.amount), 0.00) > 0 
            THEN ROUND((COALESCE(SUM(e.amount), 0.00) / SUM(b.amount) * 100), 2)
            ELSE 0.00
        END as budget_utilization,
        CASE 
            WHEN COUNT(p.id) > 0 
            THEN ROUND((SUM(p.amount) / NULLIF(EXTRACT(MONTH FROM (MAX(p.payment_date) - MIN(p.payment_date))) + 1, 0)), 2)
            ELSE 0.00
        END as average_monthly_revenue,
        MAX(p.payment_date) as last_payment_date,
        MAX(e.expense_date) as last_expense_date,
        COUNT(p.id) as payment_count,
        COUNT(e.id) as expense_count,
        now() as updated_at
    FROM public.clients c
    LEFT JOIN public.payments p ON p.client_id = c.id AND p.status = 'completed'
    LEFT JOIN public.expenses e ON e.client_id = c.id AND e.status = 'approved'
    LEFT JOIN public.budgets b ON b.client_id = c.id
    WHERE c.id = target_client_id
    GROUP BY c.id
    ON CONFLICT (client_id) 
    DO UPDATE SET
        total_revenue = EXCLUDED.total_revenue,
        total_expenses = EXCLUDED.total_expenses,
        net_profit = EXCLUDED.net_profit,
        profit_margin = EXCLUDED.profit_margin,
        total_payments = EXCLUDED.total_payments,
        total_budgets = EXCLUDED.total_budgets,
        budget_utilization = EXCLUDED.budget_utilization,
        average_monthly_revenue = EXCLUDED.average_monthly_revenue,
        last_payment_date = EXCLUDED.last_payment_date,
        last_expense_date = EXCLUDED.last_expense_date,
        payment_count = EXCLUDED.payment_count,
        expense_count = EXCLUDED.expense_count,
        updated_at = EXCLUDED.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update financial summary when payments/expenses change
CREATE OR REPLACE FUNCTION public.trigger_update_client_financial_summary()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM public.update_client_financial_summary(OLD.client_id);
        RETURN OLD;
    ELSE
        PERFORM public.update_client_financial_summary(NEW.client_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers on payments table
DROP TRIGGER IF EXISTS update_client_financial_summary_on_payment_change ON public.payments;
CREATE TRIGGER update_client_financial_summary_on_payment_change
    AFTER INSERT OR UPDATE OR DELETE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_client_financial_summary();

-- Create triggers on expenses table
DROP TRIGGER IF EXISTS update_client_financial_summary_on_expense_change ON public.expenses;
CREATE TRIGGER update_client_financial_summary_on_expense_change
    AFTER INSERT OR UPDATE OR DELETE ON public.expenses
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_client_financial_summary();

-- Create triggers on budgets table
DROP TRIGGER IF EXISTS update_client_financial_summary_on_budget_change ON public.budgets;
CREATE TRIGGER update_client_financial_summary_on_budget_change
    AFTER INSERT OR UPDATE OR DELETE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_update_client_financial_summary();