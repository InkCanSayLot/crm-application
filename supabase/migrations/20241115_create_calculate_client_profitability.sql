-- Create calculate_client_profitability function
CREATE OR REPLACE FUNCTION public.calculate_client_profitability(
    client_uuid UUID,
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    client_id UUID,
    total_revenue NUMERIC,
    total_expenses NUMERIC,
    net_profit NUMERIC,
    profit_margin NUMERIC,
    total_payments BIGINT,
    total_expenses_count BIGINT,
    average_payment_amount NUMERIC,
    average_expense_amount NUMERIC,
    last_payment_date DATE,
    last_expense_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        COALESCE(SUM(p.amount), 0.00) as total_revenue,
        COALESCE(SUM(e.amount), 0.00) as total_expenses,
        COALESCE(SUM(p.amount), 0.00) - COALESCE(SUM(e.amount), 0.00) as net_profit,
        CASE 
            WHEN COALESCE(SUM(p.amount), 0.00) > 0 
            THEN ROUND(((COALESCE(SUM(p.amount), 0.00) - COALESCE(SUM(e.amount), 0.00)) / SUM(p.amount) * 100), 2)
            ELSE 0.00
        END as profit_margin,
        COUNT(p.id) as total_payments,
        COUNT(e.id) as total_expenses_count,
        CASE 
            WHEN COUNT(p.id) > 0 
            THEN ROUND(AVG(p.amount), 2)
            ELSE 0.00
        END as average_payment_amount,
        CASE 
            WHEN COUNT(e.id) > 0 
            THEN ROUND(AVG(e.amount), 2)
            ELSE 0.00
        END as average_expense_amount,
        MAX(p.payment_date) as last_payment_date,
        MAX(e.expense_date) as last_expense_date
    FROM public.clients c
    LEFT JOIN public.payments p ON p.client_id = c.id 
        AND p.status = 'completed'
        AND p.payment_date >= start_date 
        AND p.payment_date <= end_date
    LEFT JOIN public.expenses e ON e.client_id = c.id 
        AND e.status = 'approved'
        AND e.expense_date >= start_date 
        AND e.expense_date <= end_date
    WHERE c.id = client_uuid
    GROUP BY c.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.calculate_client_profitability(UUID, DATE, DATE) TO anon, authenticated;