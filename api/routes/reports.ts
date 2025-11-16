/**
 * Reports API routes
 * Handle report generation, export functionality, and export history
 */
import { Router, type Request, type Response } from 'express'
import { supabaseServiceClient as supabase } from '../config/supabase'
import { Parser } from 'json2csv'
import PDFDocument from 'pdfkit'

const router = Router()

// ============================================================================
// REPORT GENERATION ROUTES
// ============================================================================

/**
 * Generate Financial Summary Report
 * POST /api/reports/financial-summary
 */
router.post('/financial-summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, format = 'json' } = req.body

    // Fetch financial data
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (budgetsError || paymentsError) {
      res.status(400).json({
        success: false,
        error: 'Failed to fetch financial data'
      })
      return
    }

    // Calculate financial metrics
    const totalRevenue = payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0
    const totalBudget = budgets?.reduce((sum, budget) => sum + (budget.amount || 0), 0) || 0
    const totalExpenses = budgets?.reduce((sum, budget) => sum + (budget.spent_amount || 0), 0) || 0
    const netProfit = totalRevenue - totalExpenses
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0

    const reportData = {
      reportType: 'Financial Summary',
      dateRange: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      metrics: {
        totalRevenue,
        totalBudget,
        totalExpenses,
        netProfit,
        profitMargin: Math.round(profitMargin * 100) / 100
      },
      details: {
        budgets: budgets || [],
        payments: payments || []
      }
    }

    // Create export job record
    const { data: exportJob, error: jobError } = await supabase
      .from('export_jobs')
      .insert({
        report_name: 'Financial Summary Report',
        report_type: 'financial-summary',
        status: 'completed',
        format,
        data: reportData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating export job:', jobError)
    }

    res.status(200).json({
      success: true,
      data: reportData,
      exportJobId: exportJob?.id
    })
  } catch (error) {
    console.error('Error generating financial summary:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate financial summary report'
    })
  }
})

/**
 * Generate Client Profitability Report
 * POST /api/reports/client-profitability
 */
router.post('/client-profitability', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, format = 'json' } = req.body

    // Fetch clients
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select()

    if (clientsError) {
      res.status(400).json({
        success: false,
        error: 'Failed to fetch client data'
      })
      return
    }

    // Fetch budgets and payments separately
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select()
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select()
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (budgetsError || paymentsError) {
      res.status(400).json({
        success: false,
        error: 'Failed to fetch financial data'
      })
      return
    }

    // Calculate profitability per client
    const clientProfitability = clients?.map(client => {
      const clientBudgets = budgets?.filter((budget: any) => budget.client_id === client.id) || []
      const clientPayments = payments?.filter((payment: any) => payment.client_id === client.id) || []

      const revenue = clientPayments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0)
      const expenses = clientBudgets.reduce((sum: number, budget: any) => sum + (budget.spent_amount || 0), 0)
      const profit = revenue - expenses
      const roi = expenses > 0 ? (profit / expenses) * 100 : 0

      return {
        clientId: client.id,
        companyName: client.company_name,
        contactName: client.contact_name,
        revenue,
        expenses,
        profit,
        roi: Math.round(roi * 100) / 100,
        budgetCount: clientBudgets.length,
        paymentCount: clientPayments.length
      }
    }) || []

    const reportData = {
      reportType: 'Client Profitability Analysis',
      dateRange: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      summary: {
        totalClients: clientProfitability.length,
        totalRevenue: clientProfitability.reduce((sum, client) => sum + client.revenue, 0),
        totalExpenses: clientProfitability.reduce((sum, client) => sum + client.expenses, 0),
        avgROI: clientProfitability.length > 0 
          ? clientProfitability.reduce((sum, client) => sum + client.roi, 0) / clientProfitability.length 
          : 0
      },
      clients: clientProfitability
    }

    // Create export job record
    const { data: exportJob, error: jobError } = await supabase
      .from('export_jobs')
      .insert({
        report_name: 'Client Profitability Analysis',
        report_type: 'client-profitability',
        status: 'completed',
        format,
        data: reportData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating export job:', jobError)
    }

    res.status(200).json({
      success: true,
      data: reportData,
      exportJobId: exportJob?.id
    })
  } catch (error) {
    console.error('Error generating client profitability report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate client profitability report'
    })
  }
})

/**
 * Generate Budget Performance Report
 * POST /api/reports/budget-performance
 */
router.post('/budget-performance', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, format = 'json' } = req.body

    // Fetch budget data with client information
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select(`
        *,
        client:clients(id, company_name, contact_name)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)

    if (budgetsError) {
      res.status(400).json({
        success: false,
        error: 'Failed to fetch budget data'
      })
      return
    }

    // Calculate budget performance metrics
    const budgetPerformance = budgets?.map(budget => {
      const allocated = budget.amount || 0
      const spent = budget.spent_amount || 0
      const remaining = allocated - spent
      const utilizationRate = allocated > 0 ? (spent / allocated) * 100 : 0
      const variance = remaining
      const variancePercentage = allocated > 0 ? (variance / allocated) * 100 : 0

      return {
        budgetId: budget.id,
        name: budget.name,
        client: budget.client,
        allocated,
        spent,
        remaining,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        variance,
        variancePercentage: Math.round(variancePercentage * 100) / 100,
        status: budget.status,
        category: budget.category
      }
    }) || []

    const reportData = {
      reportType: 'Budget Performance Report',
      dateRange: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      summary: {
        totalBudgets: budgetPerformance.length,
        totalAllocated: budgetPerformance.reduce((sum, budget) => sum + budget.allocated, 0),
        totalSpent: budgetPerformance.reduce((sum, budget) => sum + budget.spent, 0),
        totalRemaining: budgetPerformance.reduce((sum, budget) => sum + budget.remaining, 0),
        avgUtilization: budgetPerformance.length > 0 
          ? budgetPerformance.reduce((sum, budget) => sum + budget.utilizationRate, 0) / budgetPerformance.length 
          : 0
      },
      budgets: budgetPerformance
    }

    // Create export job record
    const { data: exportJob, error: jobError } = await supabase
      .from('export_jobs')
      .insert({
        report_name: 'Budget Performance Report',
        report_type: 'budget-performance',
        status: 'completed',
        format,
        data: reportData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating export job:', jobError)
    }

    res.status(200).json({
      success: true,
      data: reportData,
      exportJobId: exportJob?.id
    })
  } catch (error) {
    console.error('Error generating budget performance report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate budget performance report'
    })
  }
})

/**
 * Generate Payment Tracking Report
 * POST /api/reports/payment-tracking
 */
router.post('/payment-tracking', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, format = 'json' } = req.body

    // Fetch payment data with client information
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select(`
        *,
        client:clients(id, company_name, contact_name)
      `)
      .gte('payment_date', startDate)
      .lte('payment_date', endDate)
      .order('payment_date', { ascending: false })

    if (paymentsError) {
      res.status(400).json({
        success: false,
        error: 'Failed to fetch payment data'
      })
      return
    }

    // Calculate payment metrics
    const totalPayments = payments?.length || 0
    const completedPayments = payments?.filter(p => p.status === 'completed').length || 0
    const pendingPayments = payments?.filter(p => p.status === 'pending').length || 0
    const failedPayments = payments?.filter(p => p.status === 'failed').length || 0
    const totalAmount = payments?.reduce((sum, p) => sum + parseFloat(p.amount), 0) || 0

    const reportData = {
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalAmount,
      completionRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0,
      payments: payments?.map(payment => ({
        id: payment.id,
        clientName: payment.client?.company_name || 'N/A',
        amount: parseFloat(payment.amount),
        currency: payment.currency || 'USD',
        paymentDate: payment.payment_date,
        status: payment.status,
        paymentMethod: payment.payment_method,
        invoiceNumber: payment.invoice_number,
        description: payment.description
      })) || []
    }

    // Create export job record
    const { data: exportJob, error: jobError } = await supabase
      .from('export_jobs')
      .insert({
        report_name: 'Payment Tracking Report',
        report_type: 'payment-tracking',
        status: 'completed',
        format,
        data: reportData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating export job:', jobError)
      res.status(400).json({
        success: false,
        error: 'Failed to create export job'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        jobId: exportJob.id,
        downloadUrl: `/api/reports/export/${exportJob.id}/${format}`,
        reportData
      }
    })
  } catch (error) {
    console.error('Error generating payment tracking report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate payment tracking report'
    })
  }
})

/**
 * Generate Client Overview Report
 * POST /api/reports/client-overview
 */
router.post('/client-overview', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, format = 'json' } = req.body

    // Fetch client data with interactions and financial data
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (clientsError) {
      res.status(400).json({
        success: false,
        error: 'Failed to fetch client data'
      })
      return
    }

    // Calculate client metrics
    const totalClients = clients?.length || 0
    const activeClients = clients?.filter(c => c.stage !== 'lost').length || 0
    const totalRevenue = 0 // Will be calculated when we add payment relationships back

    const reportData = {
      totalClients,
      activeClients,
      lostClients: totalClients - activeClients,
      totalRevenue,
      averageRevenue: totalClients > 0 ? totalRevenue / totalClients : 0,
      clients: clients?.map(client => ({
        id: client.id,
        companyName: client.company_name,
        contactName: client.contact_name,
        email: client.email,
        phone: client.phone,
        stage: client.stage,
        dealValue: client.deal_value || 0,
        interactionCount: 0, // Will be added when we add relationships back
        totalRevenue: 0, // Will be added when we add relationships back
        budgetCount: 0, // Will be added when we add relationships back
        totalBudget: 0, // Will be added when we add relationships back
        createdAt: client.created_at,
        lastContact: client.last_contact
      })) || []
    }

    // Create export job record
    const { data: exportJob, error: jobError } = await supabase
      .from('export_jobs')
      .insert({
        report_name: 'Client Overview Report',
        report_type: 'client-overview',
        status: 'completed',
        format,
        data: reportData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating export job:', jobError)
      res.status(400).json({
        success: false,
        error: 'Failed to create export job'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        jobId: exportJob.id,
        downloadUrl: `/api/reports/export/${exportJob.id}/${format}`,
        reportData
      }
    })
  } catch (error) {
    console.error('Error generating client overview report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate client overview report'
    })
  }
})

/**
 * Generate Vendor Analysis Report
 * POST /api/reports/vendor-analysis
 */
router.post('/vendor-analysis', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, format = 'json' } = req.body

    // Fetch vendor data
    const { data: vendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('*')
      .order('name', { ascending: true })

    if (vendorsError) {
      res.status(400).json({
        success: false,
        error: 'Failed to fetch vendor data'
      })
      return
    }

    // Calculate vendor metrics
    const totalVendors = vendors?.length || 0
    const activeVendors = vendors?.filter(v => v.status === 'active').length || 0
    const totalSpending = 0 // Will be calculated when we add expense relationships back

    const reportData = {
      totalVendors,
      activeVendors,
      inactiveVendors: totalVendors - activeVendors,
      totalSpending,
      averageSpending: totalVendors > 0 ? totalSpending / totalVendors : 0,
      vendors: vendors?.map(vendor => ({
        id: vendor.id,
        name: vendor.name,
        contactPerson: vendor.contact_person,
        email: vendor.email,
        phone: vendor.phone,
        status: vendor.status,
        vendorType: vendor.category,
        totalSpending: 0, // Will be calculated when we add expense relationships back
        expenseCount: 0, // Will be calculated when we add expense relationships back
        paymentTerms: vendor.payment_terms,
        createdAt: vendor.created_at
      })) || []
    }

    // Create export job record
    const { data: exportJob, error: jobError } = await supabase
      .from('export_jobs')
      .insert({
        report_name: 'Vendor Analysis Report',
        report_type: 'vendor-analysis',
        status: 'completed',
        format,
        data: reportData,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating export job:', jobError)
      res.status(400).json({
        success: false,
        error: 'Failed to create export job'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        jobId: exportJob.id,
        downloadUrl: `/api/reports/export/${exportJob.id}/${format}`,
        reportData
      }
    })
  } catch (error) {
    console.error('Error generating vendor analysis report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate vendor analysis report'
    })
  }
})

// ============================================================================
// EXPORT FUNCTIONALITY
// ============================================================================

/**
 * Export report as CSV
 * GET /api/reports/export/:jobId/csv
 */
router.get('/export/:jobId/csv', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params

    // Fetch export job
    const { data: exportJob, error } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error || !exportJob) {
      res.status(404).json({
        success: false,
        error: 'Export job not found'
      })
      return
    }

    const reportData = exportJob.data

    // Convert to CSV based on report type
    let csvData: any[] = []
    let filename = 'report.csv'

    switch (exportJob.report_type) {
      case 'financial-summary':
        csvData = [
          { Metric: 'Total Revenue', Value: reportData.metrics.totalRevenue },
          { Metric: 'Total Budget', Value: reportData.metrics.totalBudget },
          { Metric: 'Total Expenses', Value: reportData.metrics.totalExpenses },
          { Metric: 'Net Profit', Value: reportData.metrics.netProfit },
          { Metric: 'Profit Margin (%)', Value: reportData.metrics.profitMargin }
        ]
        filename = 'financial-summary.csv'
        break

      case 'client-profitability':
        csvData = reportData.clients.map((client: any) => ({
          'Company Name': client.companyName,
          'Contact Name': client.contactName,
          'Revenue': client.revenue,
          'Expenses': client.expenses,
          'Profit': client.profit,
          'ROI (%)': client.roi,
          'Budget Count': client.budgetCount,
          'Payment Count': client.paymentCount
        }))
        filename = 'client-profitability.csv'
        break

      case 'budget-performance':
        csvData = reportData.budgets.map((budget: any) => ({
          'Budget Name': budget.name,
          'Client': budget.client?.company_name || 'N/A',
          'Allocated': budget.allocated,
          'Spent': budget.spent,
          'Remaining': budget.remaining,
          'Utilization Rate (%)': budget.utilizationRate,
          'Variance': budget.variance,
          'Variance (%)': budget.variancePercentage,
          'Status': budget.status,
          'Category': budget.category
        }))
        filename = 'budget-performance.csv'
        break

      case 'payment-tracking':
        csvData = reportData.payments.map((payment: any) => ({
          'Client Name': payment.clientName,
          'Amount': payment.amount,
          'Currency': payment.currency,
          'Payment Date': payment.paymentDate,
          'Status': payment.status,
          'Payment Method': payment.paymentMethod,
          'Invoice Number': payment.invoiceNumber,
          'Description': payment.description
        }))
        filename = 'payment-tracking.csv'
        break

      case 'client-overview':
        csvData = reportData.clients.map((client: any) => ({
          'Company Name': client.companyName,
          'Contact Name': client.contactName,
          'Email': client.email,
          'Phone': client.phone,
          'Stage': client.stage,
          'Deal Value': client.dealValue,
          'Interaction Count': client.interactionCount,
          'Total Revenue': client.totalRevenue,
          'Budget Count': client.budgetCount,
          'Total Budget': client.totalBudget,
          'Created At': client.createdAt,
          'Last Contact': client.lastContact
        }))
        filename = 'client-overview.csv'
        break

      case 'vendor-analysis':
        csvData = reportData.vendors.map((vendor: any) => ({
          'Vendor Name': vendor.name,
          'Contact Person': vendor.contactPerson,
          'Email': vendor.email,
          'Phone': vendor.phone,
          'Status': vendor.status,
          'Vendor Type': vendor.vendorType,
          'Total Spending': vendor.totalSpending,
          'Expense Count': vendor.expenseCount,
          'Payment Terms': vendor.paymentTerms,
          'Created At': vendor.createdAt
        }))
        filename = 'vendor-analysis.csv'
        break

      default:
        csvData = [{ Error: 'Unknown report type' }]
    }

    // Generate CSV
    const parser = new Parser()
    const csv = parser.parse(csvData)

    // Update export job with download info
    await supabase
      .from('export_jobs')
      .update({ 
        downloaded_at: new Date().toISOString(),
        download_count: (exportJob.download_count || 0) + 1
      })
      .eq('id', jobId)

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.status(200).send(csv)
  } catch (error) {
    console.error('Error exporting CSV:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to export CSV'
    })
  }
})

/**
 * Export report as PDF
 * GET /api/reports/export/:jobId/pdf
 */
router.get('/export/:jobId/pdf', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params

    // Fetch export job
    const { data: exportJob, error } = await supabase
      .from('export_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error || !exportJob) {
      res.status(404).json({
        success: false,
        error: 'Export job not found'
      })
      return
    }

    const reportData = exportJob.data

    // Create PDF
    const doc = new PDFDocument()
    let filename = 'report.pdf'

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    // Pipe PDF to response
    doc.pipe(res)

    // Add content based on report type
    doc.fontSize(20).text(reportData.reportType, 50, 50)
    doc.fontSize(12).text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, 50, 80)
    doc.fontSize(12).text(`Date Range: ${reportData.dateRange.startDate} to ${reportData.dateRange.endDate}`, 50, 100)

    let yPosition = 140

    switch (exportJob.report_type) {
      case 'financial-summary':
        doc.fontSize(16).text('Financial Metrics', 50, yPosition)
        yPosition += 30
        doc.fontSize(12)
          .text(`Total Revenue: $${reportData.metrics.totalRevenue.toLocaleString()}`, 50, yPosition)
          .text(`Total Budget: $${reportData.metrics.totalBudget.toLocaleString()}`, 50, yPosition + 20)
          .text(`Total Expenses: $${reportData.metrics.totalExpenses.toLocaleString()}`, 50, yPosition + 40)
          .text(`Net Profit: $${reportData.metrics.netProfit.toLocaleString()}`, 50, yPosition + 60)
          .text(`Profit Margin: ${reportData.metrics.profitMargin}%`, 50, yPosition + 80)
        filename = 'financial-summary.pdf'
        break

      case 'client-profitability':
        doc.fontSize(16).text('Client Profitability Summary', 50, yPosition)
        yPosition += 30
        doc.fontSize(12)
          .text(`Total Clients: ${reportData.summary.totalClients}`, 50, yPosition)
          .text(`Total Revenue: $${reportData.summary.totalRevenue.toLocaleString()}`, 50, yPosition + 20)
          .text(`Total Expenses: $${reportData.summary.totalExpenses.toLocaleString()}`, 50, yPosition + 40)
          .text(`Average ROI: ${reportData.summary.avgROI.toFixed(2)}%`, 50, yPosition + 60)
        
        yPosition += 100
        doc.fontSize(14).text('Top Clients by Profit:', 50, yPosition)
        yPosition += 25
        
        reportData.clients
          .sort((a: any, b: any) => b.profit - a.profit)
          .slice(0, 10)
          .forEach((client: any, index: number) => {
            doc.fontSize(10).text(
              `${index + 1}. ${client.companyName} - Profit: $${client.profit.toLocaleString()} (ROI: ${client.roi}%)`,
              50, yPosition
            )
            yPosition += 15
          })
        filename = 'client-profitability.pdf'
        break

      case 'budget-performance':
        doc.fontSize(16).text('Budget Performance Summary', 50, yPosition)
        yPosition += 30
        doc.fontSize(12)
          .text(`Total Budgets: ${reportData.summary.totalBudgets}`, 50, yPosition)
          .text(`Total Allocated: $${reportData.summary.totalAllocated.toLocaleString()}`, 50, yPosition + 20)
          .text(`Total Spent: $${reportData.summary.totalSpent.toLocaleString()}`, 50, yPosition + 40)
          .text(`Total Remaining: $${reportData.summary.totalRemaining.toLocaleString()}`, 50, yPosition + 60)
          .text(`Average Utilization: ${reportData.summary.avgUtilization.toFixed(2)}%`, 50, yPosition + 80)
        filename = 'budget-performance.pdf'
        break
    }

    // Finalize PDF
    doc.end()

    // Update export job with download info
    await supabase
      .from('export_jobs')
      .update({ 
        downloaded_at: new Date().toISOString(),
        download_count: (exportJob.download_count || 0) + 1
      })
      .eq('id', jobId)

  } catch (error) {
    console.error('Error exporting PDF:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to export PDF'
    })
  }
})

// ============================================================================
// EXPORT HISTORY
// ============================================================================

/**
 * Get export history
 * GET /api/reports/export-history
 */
router.get('/export-history', async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0 } = req.query

    const { data: exportJobs, error } = await supabase
      .from('export_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1)

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: exportJobs || []
    })
  } catch (error) {
    console.error('Error fetching export history:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch export history'
    })
  }
})

/**
 * Delete export job
 * DELETE /api/reports/export-history/:jobId
 */
router.delete('/export-history/:jobId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params

    const { error } = await supabase
      .from('export_jobs')
      .delete()
      .eq('id', jobId)

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Export job deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting export job:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to delete export job'
    })
  }
})

export default router