import React, { useState, useEffect } from 'react';
import { crmApi, calendarApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Area,
  AreaChart,
  Pie
} from 'recharts';
import toast from 'react-hot-toast';

interface AnalyticsData {
  totalRevenue: number;
  totalClients: number;
  activeDeals: number;
  conversionRate: number;
  avgDealValue: number;
  monthlyGrowth: number;
  clientsByStage: { stage: string; count: number; value: number }[];
  revenueByMonth: { month: string; revenue: number; deals: number }[];
  topClients: { name: string; value: number; deals: number }[];
  activityMetrics: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    upcomingEvents: number;
  };
  performanceMetrics: {
    avgDealCycleTime: number;
    leadResponseTime: number;
    customerRetentionRate: number;
    salesVelocity: number;
  };
  forecasting: {
    projectedRevenue: number;
    pipelineValue: number;
    expectedClosingDeals: number;
    forecastAccuracy: number;
  };
  teamPerformance: {
    topPerformer: string;
    avgDealsPerUser: number;
    teamProductivity: number;
  };
  trends: {
    revenueGrowthTrend: 'up' | 'down' | 'stable';
    clientGrowthTrend: 'up' | 'down' | 'stable';
    conversionTrend: 'up' | 'down' | 'stable';
    activityTrend: 'up' | 'down' | 'stable';
  };
  insights: {
    bestPerformingStage: string;
    worstPerformingStage: string;
    peakRevenueMonth: string;
    recommendedActions: string[];
  };
}

const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

const STAGE_COLORS: { [key: string]: string } = {
  'lead': '#6b7280',
  'qualified': '#3b82f6',
  'proposal': '#f59e0b',
  'negotiation': '#8b5cf6',
  'closed-won': '#10b981',
  'closed-lost': '#ef4444'
};

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, [user, dateRange]);

  // Auto-refresh every 5 minutes when enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchAnalyticsData();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [autoRefresh, dateRange]);

  const fetchAnalyticsData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch data from backend APIs
      const clientsResponse = await crmApi.getClients();
      const tasksResponse = await calendarApi.getTasks();
      const eventsResponse = await calendarApi.getEvents();

      // Ensure data is always an array before processing
      const clientsArray = Array.isArray((clientsResponse as any)?.data) ? (clientsResponse as any).data : [];
      const tasksArray = Array.isArray((tasksResponse as any)?.data) ? (tasksResponse as any).data : [];
      const eventsArray = Array.isArray((eventsResponse as any)?.data) ? (eventsResponse as any).data : [];
      
      // Process data
      const processedData = processAnalyticsData(clientsArray, tasksArray, eventsArray, parseInt(dateRange));
      setData(processedData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to fetch analytics data');
      // Set empty data on error to prevent issues
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (clients: any[], tasks: any[], events: any[], days: number): AnalyticsData => {
    // Ensure all inputs are arrays
    const clientsArray = Array.isArray(clients) ? clients : [];
    const tasksArray = Array.isArray(tasks) ? tasks : [];
    const eventsArray = Array.isArray(events) ? events : [];
    
    // Filter data based on date range
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const filteredClients = clientsArray.filter(client => {
      const createdDate = new Date(client.created_at || client.date_created || Date.now());
      return createdDate >= cutoffDate;
    });
    
    const filteredTasks = tasksArray.filter(task => {
      const taskDate = new Date(task.created_at || task.date_created || Date.now());
      return taskDate >= cutoffDate;
    });
    
    const filteredEvents = eventsArray.filter(event => {
      const eventDate = new Date(event.created_at || event.date_created || Date.now());
      return eventDate >= cutoffDate;
    });

    // Calculate basic metrics with real data
    const wonDeals = clientsArray.filter(c => c.stage === 'closed-won');
    const totalRevenue = wonDeals.reduce((sum, client) => sum + (client.deal_value || 0), 0);
    const totalClients = clientsArray.length;
    const activeDeals = clientsArray.filter(c => !['closed-won', 'closed-lost'].includes(c.stage)).length;
    const conversionRate = totalClients > 0 ? (wonDeals.length / totalClients) * 100 : 0;
    const avgDealValue = wonDeals.length > 0 ? totalRevenue / wonDeals.length : 0;

    // Calculate real monthly growth
    const currentMonth = new Date();
    const lastMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    const currentMonthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    
    const currentMonthRevenue = wonDeals
      .filter(client => {
        const closedDate = new Date(client.updated_at || client.created_at || Date.now());
        return closedDate >= currentMonthStart;
      })
      .reduce((sum, client) => sum + (client.deal_value || 0), 0);
    
    const lastMonthRevenue = wonDeals
      .filter(client => {
        const closedDate = new Date(client.updated_at || client.created_at || Date.now());
        return closedDate >= lastMonth && closedDate < currentMonthStart;
      })
      .reduce((sum, client) => sum + (client.deal_value || 0), 0);
    
    const monthlyGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : currentMonthRevenue > 0 ? 100 : 0;

    // Clients by stage with real data
    const stageGroups = clientsArray.reduce((acc, client) => {
      const stage = client.stage || 'lead';
      if (!acc[stage]) {
        acc[stage] = { count: 0, value: 0 };
      }
      acc[stage].count++;
      acc[stage].value += client.deal_value || 0;
      return acc;
    }, {} as { [key: string]: { count: number; value: number } });

    const clientsByStage = Object.entries(stageGroups).map(([stage, data]) => ({
      stage: stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: (data as { count: number; value: number }).count,
      value: (data as { count: number; value: number }).value
    }));

    // Real revenue by month calculation
    const revenueByMonth = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthlyWonDeals = wonDeals.filter(client => {
        const closedDate = new Date(client.updated_at || client.created_at || Date.now());
        return closedDate >= monthStart && closedDate <= monthEnd;
      });
      
      const monthRevenue = monthlyWonDeals.reduce((sum, client) => sum + (client.deal_value || 0), 0);
      
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue,
        deals: monthlyWonDeals.length
      };
    });

    // Top clients with real deal counting
    const clientDealCounts = clientsArray.reduce((acc, client) => {
      const name = client.company_name || 'Unknown';
      if (!acc[name]) {
        acc[name] = { value: 0, deals: 0 };
      }
      acc[name].value += client.deal_value || 0;
      acc[name].deals += 1;
      return acc;
    }, {} as { [key: string]: { value: number; deals: number } });
    
    const topClients = Object.entries(clientDealCounts)
      .map(([name, data]) => ({ name, ...(data as { value: number; deals: number }) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Enhanced activity metrics
    const completedTasks = tasksArray.filter(t => t.completed).length;
    const overdueTasks = tasksArray.filter(t => {
      if (t.completed) return false;
      const dueDate = new Date(t.due_date);
      return dueDate < new Date();
    }).length;
    
    const upcomingEvents = eventsArray.filter(event => {
      const eventDate = new Date(event.start_time || event.date);
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return eventDate >= now && eventDate <= nextWeek;
    }).length;
    
    const activityMetrics = {
      totalTasks: tasksArray.length,
      completedTasks,
      overdueTasks,
      upcomingEvents
    };

    // Advanced Performance Metrics
    const dealCycleTimes = wonDeals
      .filter(client => client.created_at && client.updated_at)
      .map(client => {
        const created = new Date(client.created_at);
        const closed = new Date(client.updated_at);
        return Math.abs(closed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
      });
    
    const avgDealCycleTime = dealCycleTimes.length > 0 
      ? dealCycleTimes.reduce((sum, time) => sum + time, 0) / dealCycleTimes.length 
      : 0;
    
    const leadResponseTime = 0; // TODO: Calculate from actual response time data
    const customerRetentionRate = 0; // TODO: Calculate from actual retention data
    const salesVelocity = avgDealValue * conversionRate * (30 / Math.max(avgDealCycleTime, 1));
    
    const performanceMetrics = {
      avgDealCycleTime,
      leadResponseTime,
      customerRetentionRate,
      salesVelocity
    };

    // Forecasting Metrics
    const pipelineValue = activeDeals > 0 
      ? clientsArray
          .filter(c => !['closed-won', 'closed-lost'].includes(c.stage))
          .reduce((sum, client) => sum + (client.deal_value || 0), 0)
      : 0;
    
    const projectedRevenue = pipelineValue * (conversionRate / 100);
    const expectedClosingDeals = Math.round(activeDeals * (conversionRate / 100));
    const forecastAccuracy = 0; // TODO: Calculate from actual forecast vs actual results data
    
    const forecasting = {
      projectedRevenue,
      pipelineValue,
      expectedClosingDeals,
      forecastAccuracy
    };

    // Team Performance Metrics
    const userPerformance = clientsArray.reduce((acc, client) => {
      const assignedTo = client.assigned_to || client.owner || 'Unassigned';
      if (!acc[assignedTo]) {
        acc[assignedTo] = { deals: 0, revenue: 0 };
      }
      if (client.stage === 'closed-won') {
        acc[assignedTo].deals += 1;
        acc[assignedTo].revenue += client.deal_value || 0;
      }
      return acc;
    }, {} as { [key: string]: { deals: number; revenue: number } });
    
    const topPerformerEntry = Object.entries(userPerformance)
      .sort(([,a], [,b]) => (b as { deals: number; revenue: number }).revenue - (a as { deals: number; revenue: number }).revenue)[0];
    
    const topPerformer = topPerformerEntry ? topPerformerEntry[0] : 'No data';
    const totalUsers = Object.keys(userPerformance).length || 1;
    const avgDealsPerUser = wonDeals.length / totalUsers;
    const teamProductivity = completedTasks > 0 ? (completedTasks / tasksArray.length) * 100 : 0;
    
    const teamPerformance = {
      topPerformer,
      avgDealsPerUser,
      teamProductivity
    };

    // Calculate trends
    const revenueGrowthTrend: 'up' | 'down' | 'stable' = monthlyGrowth > 5 ? 'up' : monthlyGrowth < -5 ? 'down' : 'stable';
    const clientGrowthTrend: 'up' | 'down' | 'stable' = totalClients > filteredClients.length ? 'up' : totalClients < filteredClients.length ? 'down' : 'stable';
    const conversionTrend: 'up' | 'down' | 'stable' = conversionRate > 15 ? 'up' : conversionRate < 5 ? 'down' : 'stable';
    const activityTrend: 'up' | 'down' | 'stable' = teamProductivity > 70 ? 'up' : teamProductivity < 40 ? 'down' : 'stable';

    const trends = {
      revenueGrowthTrend,
      clientGrowthTrend,
      conversionTrend,
      activityTrend
    };

    // Generate insights
    const bestPerformingStage = clientsByStage.length > 0 
      ? clientsByStage.reduce((best, current) => 
          current.value > best.value ? current : best, clientsByStage[0]
        ).stage
      : 'N/A';
    
    const worstPerformingStage = clientsByStage.length > 0
      ? clientsByStage.reduce((worst, current) => 
          current.value < worst.value ? current : worst, clientsByStage[0]
        ).stage
      : 'N/A';
    
    const peakRevenueMonth = revenueByMonth.length > 0
      ? revenueByMonth.reduce((peak, current) => 
          current.revenue > peak.revenue ? current : peak, revenueByMonth[0]
        ).month
      : 'N/A';
    
    const recommendedActions = [];
    if (conversionRate < 10) recommendedActions.push('Focus on improving lead qualification and follow-up processes');
    if (avgDealCycleTime > 60) recommendedActions.push('Streamline sales process to reduce deal cycle time');
    if (overdueTasks > 5) recommendedActions.push('Prioritize task management and deadline adherence');
    if (monthlyGrowth < 0) recommendedActions.push('Analyze market trends and adjust sales strategy');
    if (teamProductivity < 50) recommendedActions.push('Provide additional training and support to team members');
    if (recommendedActions.length === 0) recommendedActions.push('Continue current successful strategies and monitor performance');

    const insights = {
      bestPerformingStage,
      worstPerformingStage,
      peakRevenueMonth,
      recommendedActions
    };

    return {
      totalRevenue,
      totalClients,
      activeDeals,
      conversionRate,
      avgDealValue,
      monthlyGrowth,
      clientsByStage,
      revenueByMonth,
      topClients,
      activityMetrics,
      performanceMetrics,
      forecasting,
      teamPerformance,
      trends,
      insights
    };
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.success(`Auto-refresh ${!autoRefresh ? 'enabled' : 'disabled'}`);
  };

  const exportReport = () => {
    if (!data) return;
    
    const reportData = {
      generatedAt: new Date().toISOString(),
      dateRange: `Last ${dateRange} days`,
      metrics: {
        totalRevenue: data.totalRevenue,
        totalClients: data.totalClients,
        activeDeals: data.activeDeals,
        conversionRate: data.conversionRate,
        avgDealValue: data.avgDealValue,
        monthlyGrowth: data.monthlyGrowth
      },
      clientsByStage: data.clientsByStage,
      topClients: data.topClients,
      activityMetrics: data.activityMetrics
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Report exported successfully');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="loading-skeleton">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-container h-32"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-container h-64"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-500">Unable to load analytics data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="card-header mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
            <p className="text-gray-600">Business insights and performance metrics</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4 md:mt-0">
            {lastUpdated && (
              <div className="text-xs text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="select-primary px-3 py-2"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            <button
              onClick={toggleAutoRefresh}
              className={`px-3 py-2 flex items-center text-sm ${
                autoRefresh 
                  ? 'btn-primary' 
                  : 'btn-secondary'
              }`}
            >
              <Activity className={`w-4 h-4 mr-1 ${autoRefresh ? 'animate-pulse' : ''}`} />
              Auto
            </button>
            <button
              onClick={refreshData}
              disabled={refreshing}
              className="btn-secondary px-4 py-2 flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportReport}
              className="btn-primary flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card-container">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {data.monthlyGrowth >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-green-600 mr-1" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-600 mr-1" />
            )}
            <span className={`text-sm font-medium ${
              data.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {Math.abs(data.monthlyGrowth).toFixed(1)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="card-container">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{data.totalClients}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              {data.activeDeals} active deals
            </span>
          </div>
        </div>

        <div className="card-container">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.conversionRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              Avg deal: ${data.avgDealValue.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="card-container">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Task Completion</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.activityMetrics.totalTasks > 0 
                  ? Math.round((data.activityMetrics.completedTasks / data.activityMetrics.totalTasks) * 100)
                  : 0}%
              </p>
            </div>
            <div className="bg-orange-100 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              {data.activityMetrics.overdueTasks} overdue tasks
            </span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="card-container">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#ec4899" fill="#fce7f3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Clients by Stage */}
        <div className="card-container">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Clients by Stage</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={data.clientsByStage}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                label={({ stage, count }) => `${stage}: ${count}`}
              >
                {data.clientsByStage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card-container">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Deal Cycle</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.performanceMetrics.avgDealCycleTime.toFixed(0)} days
              </p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Clock className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="card-container">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sales Velocity</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Math.round(data.performanceMetrics.salesVelocity).toLocaleString()}
              </p>
            </div>
            <div className="bg-cyan-100 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6 text-cyan-600" />
            </div>
          </div>
        </div>

        <div className="card-container">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Retention Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {data.performanceMetrics.customerRetentionRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-lg">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="card-container">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pipeline Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${data.forecasting.pipelineValue.toLocaleString()}
              </p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Target className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Forecasting & Team Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Forecasting */}
        <div className="card-container">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Forecasting</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">Projected Revenue</p>
                <p className="text-xl font-bold text-gray-900">
                  ${data.forecasting.projectedRevenue.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Expected Deals</p>
                <p className="text-lg font-semibold text-pink-600">
                  {data.forecasting.expectedClosingDeals}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Forecast Accuracy</span>
              <span className="text-lg font-semibold text-green-600">
                {data.forecasting.forecastAccuracy.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Team Performance */}
        <div className="card-container">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Team Performance</h3>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Performer</p>
                <p className="text-lg font-bold text-gray-900">
                  {data.teamPerformance.topPerformer}
                </p>
              </div>
              <div className="bg-yellow-100 p-2 rounded-full">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Avg Deals/User</span>
              <span className="text-lg font-semibold text-blue-600">
                {data.teamPerformance.avgDealsPerUser.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-900">Team Productivity</span>
              <span className="text-lg font-semibold text-purple-600">
                {data.teamPerformance.teamProductivity.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Insights & Recommendations */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg shadow p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
          <div className="bg-purple-100 p-2 rounded-lg">
            <Activity className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-1">Best Stage</p>
            <p className="text-lg font-bold text-green-600">{data.insights.bestPerformingStage}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-1">Peak Month</p>
            <p className="text-lg font-bold text-blue-600">{data.insights.peakRevenueMonth}</p>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-1">Revenue Trend</p>
            <div className="flex items-center">
              {data.trends.revenueGrowthTrend === 'up' && <ArrowUpRight className="w-5 h-5 text-green-600 mr-1" />}
              {data.trends.revenueGrowthTrend === 'down' && <ArrowDownRight className="w-5 h-5 text-red-600 mr-1" />}
              {data.trends.revenueGrowthTrend === 'stable' && <div className="w-5 h-0.5 bg-gray-400 mr-1"></div>}
              <span className={`text-lg font-bold ${
                data.trends.revenueGrowthTrend === 'up' ? 'text-green-600' : 
                data.trends.revenueGrowthTrend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {data.trends.revenueGrowthTrend.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-1">Activity Trend</p>
            <div className="flex items-center">
              {data.trends.activityTrend === 'up' && <ArrowUpRight className="w-5 h-5 text-green-600 mr-1" />}
              {data.trends.activityTrend === 'down' && <ArrowDownRight className="w-5 h-5 text-red-600 mr-1" />}
              {data.trends.activityTrend === 'stable' && <div className="w-5 h-0.5 bg-gray-400 mr-1"></div>}
              <span className={`text-lg font-bold ${
                data.trends.activityTrend === 'up' ? 'text-green-600' : 
                data.trends.activityTrend === 'down' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {data.trends.activityTrend.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Recommended Actions</h4>
          <div className="space-y-2">
            {data.insights.recommendedActions.map((action, index) => (
              <div key={index} className="flex items-start">
                <div className="bg-purple-100 text-purple-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-700">{action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Clients */}
        <div className="card-container">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Clients</h3>
            <Star className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {data.topClients.map((client, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-pink-100 text-pink-600 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mr-3">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{client.name || 'Unknown Client'}</p>
                    <p className="text-sm text-gray-500">{client.deals} deals</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${client.value.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Summary */}
        <div className="card-container">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Activity Summary</h3>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-3" />
                <span className="font-medium text-gray-900">Completed Tasks</span>
              </div>
              <span className="badge badge-success">
                {data.activityMetrics.completedTasks}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-orange-600 mr-3" />
                <span className="font-medium text-gray-900">Pending Tasks</span>
              </div>
              <span className="badge badge-warning">
                {data.activityMetrics.totalTasks - data.activityMetrics.completedTasks}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <span className="font-medium text-gray-900">Overdue Tasks</span>
              </div>
              <span className="badge badge-error">
                {data.activityMetrics.overdueTasks}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 text-green-600 mr-3" />
                <span className="font-medium text-gray-900">Upcoming Events</span>
              </div>
              <span className="badge badge-info">
                {data.activityMetrics.upcomingEvents}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}