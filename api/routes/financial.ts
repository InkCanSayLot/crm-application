/**
 * Financial Management API routes
 * Handle CRUD operations for budgets, payments, expenses, vendors, and financial analytics
 */
import { Router, type Request, type Response } from 'express'
import { supabaseServiceClient as supabase } from '../config/supabase'

const router = Router()

// ============================================================================
// BUDGETS ROUTES
// ============================================================================

/**
 * Get all budgets
 * GET /api/financial/budgets
 */
router.get('/budgets', async (req: Request, res: Response): Promise<void> => {
  try {
    const { client_id } = req.query

    let query = supabase
      .from('budgets')
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        created_by_user:users!budgets_created_by_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false })

    if (client_id) {
      query = query.eq('client_id', client_id)
    }

    const { data: budgets, error } = await query

    if (error) {
      console.error('Database error fetching budgets:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: budgets || []
    })
  } catch (error) {
    console.error('Error fetching budgets:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budgets'
    })
  }
})

/**
 * Get budget by ID
 * GET /api/financial/budgets/:id
 */
router.get('/budgets/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { data: budget, error } = await supabase
      .from('budgets')
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        created_by_user:users!budgets_created_by_fkey(id, name, email),
        expenses(id, amount, expense_category, expense_date, description, status)
      `)
      .eq('id', id)
      .single()

    if (error) {
      res.status(404).json({
        success: false,
        error: 'Budget not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: budget
    })
  } catch (error) {
    console.error('Error fetching budget:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch budget'
    })
  }
})

/**
 * Create new budget
 * POST /api/financial/budgets
 */
router.post('/budgets', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      client_id,
      name,
      total_amount,
      budget_period = 'monthly',
      start_date,
      end_date,
      status = 'active',
      created_by
    } = req.body

    // Validate required fields
    if (!client_id || !name || !total_amount || !start_date) {
      res.status(400).json({
        success: false,
        error: 'Client ID, name, total amount, and start date are required'
      })
      return
    }

    const { data: budget, error } = await supabase
      .from('budgets')
      .insert({
        client_id,
        name,
        total_amount: parseFloat(total_amount),
        budget_period,
        start_date,
        end_date,
        status,
        created_by
      })
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        created_by_user:users!budgets_created_by_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Database error creating budget:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(201).json({
      success: true,
      data: budget
    })
  } catch (error) {
    console.error('Error creating budget:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create budget'
    })
  }
})

/**
 * Update budget
 * PUT /api/financial/budgets/:id
 */
router.put('/budgets/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      name,
      total_amount,
      budget_period,
      start_date,
      end_date,
      status
    } = req.body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (total_amount !== undefined) updateData.total_amount = parseFloat(total_amount)
    if (budget_period !== undefined) updateData.budget_period = budget_period
    if (start_date !== undefined) updateData.start_date = start_date
    if (end_date !== undefined) updateData.end_date = end_date
    if (status !== undefined) updateData.status = status

    const { data: budget, error } = await supabase
      .from('budgets')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        created_by_user:users!budgets_created_by_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Database error updating budget:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: budget
    })
  } catch (error) {
    console.error('Error updating budget:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update budget'
    })
  }
})

/**
 * Delete budget
 * DELETE /api/financial/budgets/:id
 */
router.delete('/budgets/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('budgets')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error deleting budget:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Budget deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting budget:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete budget'
    })
  }
})

// ============================================================================
// PAYMENTS ROUTES
// ============================================================================

/**
 * Get all payments
 * GET /api/financial/payments
 */
router.get('/payments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { client_id, payment_type } = req.query

    let query = supabase
      .from('payments')
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        budget:budgets(id, name),
        created_by_user:users!payments_created_by_fkey(id, name, email)
      `)
      .order('payment_date', { ascending: false })

    if (client_id) {
      query = query.eq('client_id', client_id)
    }

    if (payment_type) {
      query = query.eq('payment_type', payment_type)
    }

    const { data: payments, error } = await query

    if (error) {
      console.error('Database error fetching payments:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: payments || []
    })
  } catch (error) {
    console.error('Error fetching payments:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payments'
    })
  }
})

/**
 * Get payment by ID
 * GET /api/financial/payments/:id
 */
router.get('/payments/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        budget:budgets(id, name),
        created_by_user:users!payments_created_by_fkey(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      res.status(404).json({
        success: false,
        error: 'Payment not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: payment
    })
  } catch (error) {
    console.error('Error fetching payment:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment'
    })
  }
})

/**
 * Create new payment
 * POST /api/financial/payments
 */
router.post('/payments', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      client_id,
      budget_id,
      payment_type = 'received',
      amount,
      currency = 'USD',
      payment_method = 'bank_transfer',
      payment_date,
      description,
      invoice_number,
      status = 'completed',
      created_by
    } = req.body

    // Validate required fields
    if (!client_id || !amount || !payment_date) {
      res.status(400).json({
        success: false,
        error: 'Client ID, amount, and payment date are required'
      })
      return
    }

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({
        client_id,
        budget_id,
        payment_type,
        amount: parseFloat(amount),
        currency,
        payment_method,
        payment_date,
        description,
        invoice_number,
        status,
        created_by
      })
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        budget:budgets(id, name),
        created_by_user:users!payments_created_by_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Database error creating payment:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(201).json({
      success: true,
      data: payment
    })
  } catch (error) {
    console.error('Error creating payment:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create payment'
    })
  }
})

/**
 * Update payment
 * PUT /api/financial/payments/:id
 */
router.put('/payments/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      payment_type,
      amount,
      currency,
      payment_method,
      payment_date,
      description,
      invoice_number,
      status
    } = req.body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (payment_type !== undefined) updateData.payment_type = payment_type
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (currency !== undefined) updateData.currency = currency
    if (payment_method !== undefined) updateData.payment_method = payment_method
    if (payment_date !== undefined) updateData.payment_date = payment_date
    if (description !== undefined) updateData.description = description
    if (invoice_number !== undefined) updateData.invoice_number = invoice_number
    if (status !== undefined) updateData.status = status

    const { data: payment, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        budget:budgets(id, name),
        created_by_user:users!payments_created_by_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Database error updating payment:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: payment
    })
  } catch (error) {
    console.error('Error updating payment:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update payment'
    })
  }
})

/**
 * Delete payment
 * DELETE /api/financial/payments/:id
 */
router.delete('/payments/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error deleting payment:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting payment:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete payment'
    })
  }
})

// ============================================================================
// EXPENSES ROUTES
// ============================================================================

/**
 * Get all expenses
 * GET /api/financial/expenses
 */
router.get('/expenses', async (req: Request, res: Response): Promise<void> => {
  try {
    const { client_id, budget_id, vendor_id, status } = req.query

    let query = supabase
      .from('expenses')
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        budget:budgets(id, name),
        vendor:vendors(id, name),
        created_by_user:users!expenses_created_by_fkey(id, name, email)
      `)
      .order('expense_date', { ascending: false })

    if (client_id) {
      query = query.eq('client_id', client_id)
    }

    if (budget_id) {
      query = query.eq('budget_id', budget_id)
    }

    if (vendor_id) {
      query = query.eq('vendor_id', vendor_id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: expenses, error } = await query

    if (error) {
      console.error('Database error fetching expenses:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: expenses || []
    })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expenses'
    })
  }
})

/**
 * Get expense by ID
 * GET /api/financial/expenses/:id
 */
router.get('/expenses/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { data: expense, error } = await supabase
      .from('expenses')
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        budget:budgets(id, name),
        vendor:vendors(id, name),
        created_by_user:users!expenses_created_by_fkey(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      res.status(404).json({
        success: false,
        error: 'Expense not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: expense
    })
  } catch (error) {
    console.error('Error fetching expense:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch expense'
    })
  }
})

/**
 * Create new expense
 * POST /api/financial/expenses
 */
router.post('/expenses', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      client_id,
      budget_id,
      vendor_id,
      expense_category,
      amount,
      currency = 'USD',
      expense_date,
      description,
      receipt_url,
      status = 'approved',
      created_by
    } = req.body

    // Validate required fields
    if (!expense_category || !amount || !expense_date || !description) {
      res.status(400).json({
        success: false,
        error: 'Expense category, amount, expense date, and description are required'
      })
      return
    }

    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({
        client_id,
        budget_id,
        vendor_id,
        expense_category,
        amount: parseFloat(amount),
        currency,
        expense_date,
        description,
        receipt_url,
        status,
        created_by
      })
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        budget:budgets(id, name),
        vendor:vendors(id, name),
        created_by_user:users!expenses_created_by_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Database error creating expense:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(201).json({
      success: true,
      data: expense
    })
  } catch (error) {
    console.error('Error creating expense:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create expense'
    })
  }
})

/**
 * Update expense
 * PUT /api/financial/expenses/:id
 */
router.put('/expenses/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      expense_category,
      amount,
      currency,
      expense_date,
      description,
      receipt_url,
      status
    } = req.body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (expense_category !== undefined) updateData.expense_category = expense_category
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (currency !== undefined) updateData.currency = currency
    if (expense_date !== undefined) updateData.expense_date = expense_date
    if (description !== undefined) updateData.description = description
    if (receipt_url !== undefined) updateData.receipt_url = receipt_url
    if (status !== undefined) updateData.status = status

    const { data: expense, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        budget:budgets(id, name),
        vendor:vendors(id, name),
        created_by_user:users!expenses_created_by_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Database error updating expense:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: expense
    })
  } catch (error) {
    console.error('Error updating expense:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update expense'
    })
  }
})

/**
 * Delete expense
 * DELETE /api/financial/expenses/:id
 */
router.delete('/expenses/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error deleting expense:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Expense deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting expense:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete expense'
    })
  }
})

// ============================================================================
// VENDORS ROUTES
// ============================================================================

/**
 * Get all vendors
 * GET /api/financial/vendors
 */
router.get('/vendors', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query

    let query = supabase
      .from('vendors')
      .select('*')
      .order('name', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: vendors, error } = await query

    if (error) {
      console.error('Database error fetching vendors:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: vendors || []
    })
  } catch (error) {
    console.error('Error fetching vendors:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendors'
    })
  }
})

/**
 * Get vendor by ID
 * GET /api/financial/vendors/:id
 */
router.get('/vendors/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { data: vendor, error } = await supabase
      .from('vendors')
      .select(`
        *,
        expenses(id, amount, expense_category, expense_date, description, status)
      `)
      .eq('id', id)
      .single()

    if (error) {
      res.status(404).json({
        success: false,
        error: 'Vendor not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: vendor
    })
  } catch (error) {
    console.error('Error fetching vendor:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch vendor'
    })
  }
})

/**
 * Create new vendor
 * POST /api/financial/vendors
 */
router.post('/vendors', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      contact_person,
      email,
      phone,
      address,
      vendor_type,
      payment_terms,
      tax_id,
      status = 'active'
    } = req.body

    // Validate required fields
    if (!name) {
      res.status(400).json({
        success: false,
        error: 'Name is required'
      })
      return
    }

    const { data: vendor, error } = await supabase
      .from('vendors')
      .insert({
        name,
        contact_person,
        email,
        phone,
        address,
        vendor_type,
        payment_terms,
        tax_id,
        status
      })
      .select('*')
      .single()

    if (error) {
      console.error('Database error creating vendor:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(201).json({
      success: true,
      data: vendor
    })
  } catch (error) {
    console.error('Error creating vendor:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create vendor'
    })
  }
})

/**
 * Update vendor
 * PUT /api/financial/vendors/:id
 */
router.put('/vendors/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      name,
      contact_person,
      email,
      phone,
      address,
      vendor_type,
      payment_terms,
      tax_id,
      status
    } = req.body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (contact_person !== undefined) updateData.contact_person = contact_person
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (vendor_type !== undefined) updateData.vendor_type = vendor_type
    if (payment_terms !== undefined) updateData.payment_terms = payment_terms
    if (tax_id !== undefined) updateData.tax_id = tax_id
    if (status !== undefined) updateData.status = status

    const { data: vendor, error } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Database error updating vendor:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: vendor
    })
  } catch (error) {
    console.error('Error updating vendor:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update vendor'
    })
  }
})

/**
 * Delete vendor
 * DELETE /api/financial/vendors/:id
 */
router.delete('/vendors/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('vendors')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Database error deleting vendor:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Vendor deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting vendor:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete vendor'
    })
  }
})

// ============================================================================
// ANALYTICS ROUTES
// ============================================================================

/**
 * Get client financial summary
 * GET /api/financial/analytics/client-summary
 */
router.get('/analytics/client-summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: summary, error } = await supabase
      .from('client_financial_summary')
      .select('*')
      .order('total_revenue', { ascending: false })

    if (error) {
      console.error('Database error fetching client summary:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: summary || []
    })
  } catch (error) {
    console.error('Error fetching client summary:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client summary'
    })
  }
})

/**
 * Get client profitability analysis
 * GET /api/financial/analytics/client-profitability/:clientId
 */
router.get('/analytics/client-profitability/:clientId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params
    const { start_date, end_date } = req.query

    if (!start_date || !end_date) {
      res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      })
      return
    }

    const { data: profitability, error } = await supabase
      .rpc('calculate_client_profitability', {
        client_uuid: clientId,
        start_date: start_date as string,
        end_date: end_date as string
      })

    if (error) {
      console.error('Database error calculating profitability:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: profitability?.[0] || null
    })
  } catch (error) {
    console.error('Error calculating profitability:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to calculate profitability'
    })
  }
})

/**
 * Get financial overview
 * GET /api/financial/analytics/overview
 */
router.get('/analytics/overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query

    console.log('Starting financial overview calculation...')

    // Get total revenue
    console.log('Querying payments for revenue...')
    let revenueQuery = supabase
      .from('payments')
      .select('amount')
      .eq('status', 'completed')

    if (start_date && end_date) {
      revenueQuery = revenueQuery
        .gte('payment_date', start_date as string)
        .lte('payment_date', end_date as string)
    }

    const { data: revenueData, error: revenueError } = await revenueQuery

    if (revenueError) {
      console.error('Revenue query error:', revenueError)
      throw revenueError
    }

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + parseFloat(payment.amount), 0) || 0
    console.log(`Total revenue calculated: ${totalRevenue}`)

    // Get total expenses
    console.log('Querying expenses...')
    let expensesQuery = supabase
      .from('expenses')
      .select('amount')
      .eq('status', 'approved')

    if (start_date && end_date) {
      expensesQuery = expensesQuery
        .gte('expense_date', start_date as string)
        .lte('expense_date', end_date as string)
    }

    const { data: expensesData, error: expensesError } = await expensesQuery

    if (expensesError) {
      console.error('Expenses query error:', expensesError)
      throw expensesError
    }

    const totalExpenses = expensesData?.reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0
    console.log(`Total expenses calculated: ${totalExpenses}`)

    // Get active budgets count
    console.log('Querying active budgets...')
    const { count: activeBudgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*', { count: 'exact', head: true })

    if (budgetsError) {
      console.error('Budgets query error:', budgetsError)
      throw budgetsError
    }
    console.log(`Active budgets count: ${activeBudgets}`)

    // Get active clients count
    console.log('Querying active clients...')
    const { count: activeClients, error: clientsError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .neq('stage', 'lost')

    if (clientsError) {
      console.error('Clients query error:', clientsError)
      throw clientsError
    }
    console.log(`Active clients count: ${activeClients}`)

    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    console.log('Financial overview calculation completed successfully')
    res.status(200).json({
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        activeBudgets: activeBudgets || 0,
        activeClients: activeClients || 0
      }
    })
  } catch (error) {
    console.error('Error fetching financial overview:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch financial overview'
    })
  }
})

/**
 * Get monthly financial trends
 * GET /api/financial/analytics/monthly-trends
 */
router.get('/analytics/monthly-trends', async (req: Request, res: Response): Promise<void> => {
  try {
    const { year = new Date().getFullYear() } = req.query

    // Get monthly revenue
    const { data: monthlyRevenue, error: revenueError } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .eq('status', 'completed')
      .gte('payment_date', `${year}-01-01`)
      .lte('payment_date', `${year}-12-31`)

    if (revenueError) {
      throw revenueError
    }

    // Get monthly expenses
    const { data: monthlyExpenses, error: expensesError } = await supabase
      .from('expenses')
      .select('amount, expense_date')
      .eq('status', 'approved')
      .gte('expense_date', `${year}-01-01`)
      .lte('expense_date', `${year}-12-31`)

    if (expensesError) {
      throw expensesError
    }

    // Process data by month
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      monthName: new Date(2024, i).toLocaleString('default', { month: 'long' }),
      revenue: 0,
      expenses: 0,
      profit: 0
    }))

    // Aggregate revenue by month
    monthlyRevenue?.forEach(payment => {
      const month = new Date(payment.payment_date).getMonth()
      monthlyData[month].revenue += parseFloat(payment.amount)
    })

    // Aggregate expenses by month
    monthlyExpenses?.forEach(expense => {
      const month = new Date(expense.expense_date).getMonth()
      monthlyData[month].expenses += parseFloat(expense.amount)
    })

    // Calculate profit for each month
    monthlyData.forEach(data => {
      data.profit = data.revenue - data.expenses
    })

    res.status(200).json({
      success: true,
      data: monthlyData
    })
  } catch (error) {
    console.error('Error fetching monthly trends:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch monthly trends'
    })
  }
})

export default router