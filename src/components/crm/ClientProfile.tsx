import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Client } from '@/lib/supabase';
import { crmApi, financialApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  Linkedin, 
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  CreditCard,
  Receipt,
  Building,
  User,
  MapPin,
  Globe,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Budget {
  id: string;
  client_id: string;
  name: string;
  total_amount: number;
  spent_amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

interface Payment {
  id: string;
  client_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  status: 'pending' | 'completed' | 'failed';
  description?: string;
  created_at: string;
}

interface Expense {
  id: string;
  client_id: string;
  vendor_id?: string;
  amount: number;
  expense_date: string;
  category: string;
  description?: string;
  receipt_url?: string;
  created_at: string;
}

interface ClientAnalytics {
  total_revenue: number;
  total_expenses: number;
  profit_margin: number;
  payment_history: Payment[];
  budget_utilization: number;
  avg_project_value: number;
  client_lifetime_value: number;
}

export default function ClientProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [client, setClient] = useState<Client | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analytics, setAnalytics] = useState<ClientAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'budgets' | 'payments' | 'expenses' | 'analytics'>('overview');

  useEffect(() => {
    if (id && user?.id) {
      fetchClientData();
    }
  }, [id, user?.id]);

  const fetchClientData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      
      // Fetch client details
      const clientData = await crmApi.getClient(id);
      setClient(clientData);
      
      // Fetch financial data
      const [budgetsData, paymentsData, expensesData, analyticsData] = await Promise.all([
        financialApi.getBudgets({ client_id: id }),
        financialApi.getPayments({ client_id: id }),
        financialApi.getExpenses({ client_id: id }),
        financialApi.getClientAnalytics(id)
      ]);
      
      setBudgets(budgetsData || []);
      setPayments(paymentsData || []);
      setExpenses(expensesData || []);
      setAnalytics(analyticsData);
      
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast.error('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | undefined | null) => `$${(amount || 0).toLocaleString()}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-skeleton">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="page-container">
        <div className="text-center py-12">
          <User className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Client not found</h3>
          <p className="mt-1 text-sm text-gray-500">The client you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/crm')}
            className="mt-4 btn-primary"
          >
            Back to CRM
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'budgets', label: 'Budgets', icon: Target },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/crm')}
              className="btn-secondary flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to CRM
            </button>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0">
                {client.profile_image_url ? (
                  <img
                    src={client.profile_image_url}
                    alt={client.company_name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                    <span className="text-xl font-semibold text-white">
                      {client.company_name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{client.company_name}</h1>
                <p className="text-gray-600">{client.contact_name}</p>
                <div className="flex items-center gap-4 mt-2">
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="text-primary-600 hover:text-primary-700 flex items-center gap-1">
                      <Mail className="w-4 h-4" />
                      {client.email}
                    </a>
                  )}
                  {client.phone && (
                    <a href={`tel:${client.phone}`} className="text-primary-600 hover:text-primary-700 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {client.phone}
                    </a>
                  )}
                  {client.linkedin_url && (
                    <a href={client.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 flex items-center gap-1">
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Client
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card card-body">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics?.total_revenue || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="card card-body">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-lg">
                <Receipt className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(analytics?.total_expenses || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="card card-body">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.profit_margin ? `${analytics.profit_margin.toFixed(1)}%` : '0%'}
                </p>
              </div>
            </div>
          </div>
          <div className="card card-body">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Budgets</p>
                <p className="text-2xl font-bold text-gray-900">
                  {budgets.filter(b => b.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Client Details */}
            <div className="card card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Company</p>
                    <p className="font-medium">{client.company_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Contact Person</p>
                    <p className="font-medium">{client.contact_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{client.email || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{client.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Stage</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      client.stage === 'closed' ? 'bg-green-100 text-green-800' :
                      client.stage === 'proposal' ? 'bg-orange-100 text-orange-800' :
                      client.stage === 'meeting' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {client.stage}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Deal Value</p>
                    <p className="font-medium">{formatCurrency(client.deal_value || 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card card-body">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Financial Activity</h3>
              <div className="space-y-4">
                {payments.slice(0, 3).map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <CreditCard className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">Payment Received</p>
                        <p className="text-sm text-gray-600">{formatDate(payment.payment_date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-600">{payment.status}</p>
                    </div>
                  </div>
                ))}
                {expenses.slice(0, 2).map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-red-100 p-2 rounded-lg">
                        <Receipt className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">Expense</p>
                        <p className="text-sm text-gray-600">{formatDate(expense.expense_date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">-{formatCurrency(expense.amount)}</p>
                      <p className="text-sm text-gray-600">{expense.category}</p>
                    </div>
                  </div>
                ))}
                {payments.length === 0 && expenses.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">No recent financial activity</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'budgets' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Client Budgets</h3>
              <button className="btn-primary">Add Budget</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {budgets.map((budget) => (
                <div key={budget.id} className="card card-body">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900">{budget.name}</h4>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      budget.status === 'active' ? 'bg-green-100 text-green-800' :
                      budget.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {budget.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{((budget.spent_amount / budget.total_amount) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((budget.spent_amount / budget.total_amount) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Spent</span>
                      <span className="font-medium">{formatCurrency(budget.spent_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total</span>
                      <span className="font-medium">{formatCurrency(budget.total_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Remaining</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(budget.total_amount - budget.spent_amount)}
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">
                        {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {budgets.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Target className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No budgets found</h3>
                  <p className="mt-1 text-sm text-gray-500">Create a budget to start tracking expenses.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
              <button className="btn-primary">Record Payment</button>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(payment.payment_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.payment_method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {payment.description || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payments.length === 0 && (
                  <div className="text-center py-12">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                    <p className="mt-1 text-sm text-gray-500">Record payments to track client transactions.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Expense History</h3>
              <button className="btn-primary">Add Expense</button>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipt
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenses.map((expense) => (
                      <tr key={expense.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(expense.expense_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {expense.category}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {expense.description || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {expense.receipt_url ? (
                            <a href={expense.receipt_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700">
                              View Receipt
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {expenses.length === 0 && (
                  <div className="text-center py-12">
                    <Receipt className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No expenses found</h3>
                    <p className="mt-1 text-sm text-gray-500">Add expenses to track client-related costs.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Client Analytics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card card-body">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Profit Margin</h4>
                  <PieChart className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary-600 mb-2">
                    {analytics?.profit_margin ? `${analytics.profit_margin.toFixed(1)}%` : '0%'}
                  </div>
                  <p className="text-sm text-gray-600">
                    Revenue: {formatCurrency(analytics?.total_revenue || 0)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Expenses: {formatCurrency(analytics?.total_expenses || 0)}
                  </p>
                </div>
              </div>
              
              <div className="card card-body">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Budget Utilization</h4>
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {analytics?.budget_utilization ? `${analytics.budget_utilization.toFixed(1)}%` : '0%'}
                  </div>
                  <p className="text-sm text-gray-600">Average across all budgets</p>
                </div>
              </div>
              
              <div className="card card-body">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900">Lifetime Value</h4>
                  <TrendingUp className="w-5 h-5 text-gray-400" />
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatCurrency(analytics?.client_lifetime_value || 0)}
                  </div>
                  <p className="text-sm text-gray-600">Projected total value</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}