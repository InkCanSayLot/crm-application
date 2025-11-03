import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Receipt,
  PieChart,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  Building
} from 'lucide-react';
import { financialApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  RevenueExpenseChart, 
  MonthlyTrendChart, 
  ExpenseCategoryChart,
  CashFlowChart
} from '@/components/charts/ChartComponents';

interface FinancialStats {
  totalBudgets: number;
  totalPayments: number;
  totalExpenses: number;
  totalVendors: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  profitMargin: number;
}

interface Budget {
  id: string;
  client_id: string;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'overbudget';
  created_at: string;
}

interface Payment {
  id: string;
  client_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  created_at: string;
}

interface Expense {
  id: string;
  client_id: string;
  vendor_id: string;
  category: string;
  amount: number;
  expense_date: string;
  status: 'pending' | 'approved' | 'rejected';
  description: string;
  created_at: string;
}

export default function FinancialDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<FinancialStats>({
    totalBudgets: 0,
    totalPayments: 0,
    totalExpenses: 0,
    totalVendors: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
    profitMargin: 0
  });
  const [recentBudgets, setRecentBudgets] = useState<Budget[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const formatCurrency = (amount: number | undefined | null) => `$${(amount || 0).toLocaleString()}`;

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      
      // Load financial overview
      const overview = await financialApi.getFinancialOverview();
      setStats({
        totalBudgets: overview.total_budgets || 0,
        totalPayments: overview.total_payments || 0,
        totalExpenses: overview.total_expenses || 0,
        totalVendors: overview.total_vendors || 0,
        monthlyRevenue: overview.monthly_revenue || 0,
        monthlyExpenses: overview.monthly_expenses || 0,
        profitMargin: overview.profit_margin || 0
      });

      // Load recent data
      const [budgetsResponse, paymentsResponse, expensesResponse] = await Promise.all([
        financialApi.getBudgets(),
        financialApi.getPayments(),
        financialApi.getExpenses()
      ]);

      // Handle both old format (direct array) and new format ({success: true, data: []})
      const budgets = Array.isArray(budgetsResponse) ? budgetsResponse : ((budgetsResponse as any)?.data || []);
      const payments = Array.isArray(paymentsResponse) ? paymentsResponse : ((paymentsResponse as any)?.data || []);
      const expenses = Array.isArray(expensesResponse) ? expensesResponse : ((expensesResponse as any)?.data || []);

      setRecentBudgets(budgets.slice(0, 5));
      setRecentPayments(payments.slice(0, 5));
      setRecentExpenses(expenses.slice(0, 5));
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'overbudget':
      case 'failed':
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getBudgetProgress = (budget: Budget) => {
    const progress = (budget.spent_amount / budget.allocated_amount) * 100;
    return Math.min(progress, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-gray-600">Track budgets, payments, expenses, and financial performance</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/financial/budgets')}
            className="btn btn-outline"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Budget
          </button>
          <button
            onClick={() => navigate('/financial/payments')}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card card-body">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.monthlyRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Receipt className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Monthly Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(stats.monthlyExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              {stats.profitMargin >= 0 ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Profit Margin</p>
              <p className={`text-2xl font-semibold ${stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.profitMargin.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Building className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Budgets</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalBudgets}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Revenue vs Expenses</h3>
            <p className="text-sm text-gray-600">Monthly comparison over the last 6 months</p>
          </div>
          <div className="card-body">
            <RevenueExpenseChart
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                revenue: [stats.monthlyRevenue * 0.8, stats.monthlyRevenue * 0.9, stats.monthlyRevenue * 1.1, stats.monthlyRevenue * 0.95, stats.monthlyRevenue * 1.05, stats.monthlyRevenue],
                expenses: [stats.monthlyExpenses * 0.7, stats.monthlyExpenses * 0.85, stats.monthlyExpenses * 1.2, stats.monthlyExpenses * 0.9, stats.monthlyExpenses * 1.1, stats.monthlyExpenses]
              }}
              height={300}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Cash Flow Trend</h3>
            <p className="text-sm text-gray-600">Net cash flow over time</p>
          </div>
          <div className="card-body">
            <CashFlowChart
              data={{
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                inflow: [
                  stats.monthlyRevenue * 0.8,
                  stats.monthlyRevenue * 0.9,
                  stats.monthlyRevenue * 1.1,
                  stats.monthlyRevenue * 0.95,
                  stats.monthlyRevenue * 1.05,
                  stats.monthlyRevenue
                ],
                outflow: [
                  stats.monthlyExpenses * 0.8,
                  stats.monthlyExpenses * 0.9,
                  stats.monthlyExpenses * 1.1,
                  stats.monthlyExpenses * 0.95,
                  stats.monthlyExpenses * 1.05,
                  stats.monthlyExpenses
                ]
              }}
              height={300}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/financial/budgets')}
          className="card card-body hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Budget Management</h3>
              <p className="text-gray-600">Create and track project budgets</p>
            </div>
            <DollarSign className="h-8 w-8 text-blue-600" />
          </div>
        </button>

        <button
          onClick={() => navigate('/financial/payments')}
          className="card card-body hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Payment Tracking</h3>
              <p className="text-gray-600">Record and monitor payments</p>
            </div>
            <CreditCard className="h-8 w-8 text-green-600" />
          </div>
        </button>

        <button
          onClick={() => navigate('/financial/expenses')}
          className="card card-body hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Expense Management</h3>
              <p className="text-gray-600">Track and categorize expenses</p>
            </div>
            <Receipt className="h-8 w-8 text-red-600" />
          </div>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Budgets */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Budgets</h3>
              <button
                onClick={() => navigate('/financial/budgets')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
          </div>
          <div className="card-body">
            {recentBudgets.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No budgets found</p>
            ) : (
              <div className="space-y-4">
                {recentBudgets.map((budget) => (
                  <div key={budget.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{budget.category}</p>
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              getBudgetProgress(budget) > 90 ? 'bg-red-500' : 
                              getBudgetProgress(budget) > 75 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${getBudgetProgress(budget)}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatCurrency(budget.spent_amount)} / {formatCurrency(budget.allocated_amount)}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(budget.status)}`}>
                      {budget.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
              <button
                onClick={() => navigate('/financial/payments')}
                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
              >
                View All
              </button>
            </div>
          </div>
          <div className="card-body">
            {recentPayments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No payments found</p>
            ) : (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-600">{payment.description}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}