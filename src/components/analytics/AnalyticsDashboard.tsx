import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { financialApi, crmApi } from '@/lib/api';
import { 
  RevenueExpenseChart, 
  MonthlyTrendChart, 
  ExpenseCategoryChart,
  ClientProfitabilityChart,
  CashFlowChart
} from '@/components/charts/ChartComponents';

interface AnalyticsData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  totalClients: number;
  activeDeals: number;
  monthlyGrowth: number;
  clientGrowth: number;
}

interface MonthlyData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

interface ClientProfitability {
  client_id: string;
  client_name: string;
  total_revenue: number;
  total_expenses: number;
  profit: number;
  profit_margin: number;
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    totalClients: 0,
    activeDeals: 0,
    monthlyGrowth: 0,
    clientGrowth: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [clientProfitability, setClientProfitability] = useState<ClientProfitability[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12months');

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load financial analytics
      const [
        overallAnalytics,
        monthlyAnalytics,
        clientProfitabilityData,
        clientStats
      ] = await Promise.all([
        financialApi.getFinancialOverview(),
        financialApi.getMonthlyTrends(),
        financialApi.getClientProfitability(),
        crmApi.getStats()
      ]);

      // Calculate analytics data
      const totalRevenue = overallAnalytics.total_revenue || 0;
      const totalExpenses = overallAnalytics.total_expenses || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      setAnalytics({
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalClients: clientStats.totalClients || 0,
        activeDeals: clientStats.activeDeals || 0,
        monthlyGrowth: calculateGrowthRate(monthlyAnalytics, 'revenue'),
        clientGrowth: 12.5 // Mock data - would calculate from client creation dates
      });

      setMonthlyData(monthlyAnalytics || []);
      setClientProfitability(clientProfitabilityData || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowthRate = (data: MonthlyData[], metric: keyof MonthlyData): number => {
    if (data.length < 2) return 0;
    
    const current = data[data.length - 1]?.[metric] as number || 0;
    const previous = data[data.length - 2]?.[metric] as number || 0;
    
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
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
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Business performance insights and metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="input-field"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
            <option value="24months">Last 24 Months</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(analytics.totalRevenue)}
              </p>
              <div className="flex items-center mt-1">
                {analytics.monthlyGrowth >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${analytics.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(analytics.monthlyGrowth)}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(analytics.totalExpenses)}
              </p>
              <div className="flex items-center mt-1">
                <TrendingUp className="w-4 h-4 text-orange-500 mr-1" />
                <span className="text-sm text-orange-600">Tracking</span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <TrendingDown className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Net Profit</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(analytics.netProfit)}
              </p>
              <div className="flex items-center mt-1">
                <Target className="w-4 h-4 text-blue-500 mr-1" />
                <span className="text-sm text-blue-600">
                  {formatPercentage(analytics.profitMargin)} margin
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Clients</p>
              <p className="text-2xl font-semibold text-gray-900">{analytics.totalClients}</p>
              <div className="flex items-center mt-1">
                {analytics.clientGrowth >= 0 ? (
                  <ArrowUpRight className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${analytics.clientGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(analytics.clientGrowth)}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
            <p className="text-sm text-gray-600">Revenue, expenses, and profit over time</p>
          </div>
          <div className="card-body">
            {monthlyData.length > 0 ? (
              <RevenueExpenseChart
                data={{
                  labels: monthlyData.map(d => d.month),
                  revenue: monthlyData.map(d => d.revenue),
                  expenses: monthlyData.map(d => d.expenses)
                }}
                height={300}
              />
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No data available</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Monthly trends will appear here once you have financial data
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profit Margin Analysis */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Profit Margin Analysis</h3>
            <p className="text-sm text-gray-600">Profitability trends and breakdown</p>
          </div>
          <div className="card-body">
            {monthlyData.length > 0 ? (
              <MonthlyTrendChart
                data={{
                  labels: monthlyData.map(d => d.month),
                  values: monthlyData.map(d => d.profit),
                  label: 'Monthly Profit'
                }}
                height={250}
              />
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No profit data available</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Profit trends will appear here once you have financial data
                  </p>
                </div>
              </div>
            )}
            
            {/* Profit metrics */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {analytics.totalRevenue > 0 ? ((analytics.totalRevenue - analytics.totalExpenses) / analytics.totalRevenue * 100).toFixed(1) : '0.0'}%
                </p>
                <p className="text-sm text-gray-600">Overall Margin</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(analytics.totalRevenue - analytics.totalExpenses)}
                </p>
                <p className="text-sm text-gray-600">Net Profit</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Client Profitability */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Client Profitability</h3>
          <p className="text-sm text-gray-600">Top performing clients by revenue</p>
        </div>
        <div className="card-body">
          {clientProfitability.length > 0 ? (
            <ClientProfitabilityChart
              data={{
                labels: clientProfitability.slice(0, 10).map(c => c.client_name),
                revenue: clientProfitability.slice(0, 10).map(c => c.total_revenue),
                expenses: clientProfitability.slice(0, 10).map(c => c.total_expenses)
              }}
              height={250}
            />
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No client data available</p>
                <p className="text-xs text-gray-400 mt-1">
                  Client profitability will appear here once you have clients and revenue data
                </p>
              </div>
            </div>
          )}
          
          {/* Top clients list */}
          {clientProfitability.length > 0 && (
            <div className="mt-4 space-y-2">
              {clientProfitability.slice(0, 5).map((client, index) => (
                <div key={client.client_id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-500 w-6">
                      #{index + 1}
                    </span>
                    <span className="text-sm text-gray-900 ml-2">{client.client_name}</span>
                  </div>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(client.total_revenue)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Average Deal Size</p>
              <p className="text-xl font-semibold text-gray-900">
                {analytics.totalClients > 0 
                  ? formatCurrency(analytics.totalRevenue / analytics.totalClients)
                  : formatCurrency(0)
                }
              </p>
            </div>
            <Target className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Monthly Recurring Revenue</p>
              <p className="text-xl font-semibold text-gray-900">
                {formatCurrency(analytics.totalRevenue / 12)}
              </p>
            </div>
            <Calendar className="h-6 w-6 text-green-600" />
          </div>
        </div>

        <div className="card card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Cost per Client</p>
              <p className="text-xl font-semibold text-gray-900">
                {analytics.totalClients > 0 
                  ? formatCurrency(analytics.totalExpenses / analytics.totalClients)
                  : formatCurrency(0)
                }
              </p>
            </div>
            <Users className="h-6 w-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
}