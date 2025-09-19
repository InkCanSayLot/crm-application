import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { crmApi, calendarApi, journalApi, aiApi } from '../../lib/api'
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  TrendingUp, 
  Plus,
  MessageSquare,
  FileText,
  BarChart3,
  Target,
  CheckCircle,
  DollarSign,
  Clock
} from 'lucide-react';

interface DashboardStats {
  totalClients: number;
  activeDeals: number;
  completedTasks: number;
  upcomingEvents: number;
  totalRevenue: number;
  conversionRate: number;
  totalEntries?: number;
  avgMood?: number;
  aiInsights?: number;
}

interface DailyInsight {
  message: string;
  priority: 'high' | 'medium' | 'low';
  type: 'task' | 'opportunity' | 'reminder' | 'insight';
}

interface RecentActivity {
  id: string;
  type: string;
  message?: string;
  description?: string;
  timestamp?: string;
  time?: string;
  client?: string;
  user?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatCurrency } = useSettings();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeDeals: 0,
    completedTasks: 0,
    upcomingEvents: 0,
    totalRevenue: 0,
    conversionRate: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [dailyInsight, setDailyInsight] = useState<DailyInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
    generateDailyInsight()
  }, [user])



  const fetchStats = async () => {
    console.log('Dashboard.tsx - fetchStats called');
    try {
      console.log('Dashboard.tsx - Making API calls...');
      const [crmStatsRes, clientsRes, tasksRes, eventsRes, journalRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/crm/stats`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/crm/clients`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/calendar/tasks`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/calendar/events`),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/journal/entries`)
      ]);
      console.log('Dashboard.tsx - API calls completed');
      console.log('Dashboard.tsx - Response status codes:', {
        crmStats: crmStatsRes.status,
        clients: clientsRes.status,
        tasks: tasksRes.status,
        events: eventsRes.status,
        journal: journalRes.status
      });

      const [crmStats, clients, tasks, events, journalEntries] = await Promise.all([
        crmStatsRes.json(),
        clientsRes.json(),
        tasksRes.json(),
        eventsRes.json(),
        journalRes.json()
      ]);

      // Calculate average mood from journal entries with updated mood values
      const moodValues = { 
        excellent: 7, 
        good: 6, 
        motivated: 5, 
        okay: 4, 
        neutral: 3, 
        challenged: 2, 
        frustrated: 1, 
        stressed: 0 
      };
      
      const journalData = journalEntries.data || journalEntries || [];
      const avgMood = journalData.length > 0 
        ? journalData.reduce((sum: number, entry: any) => sum + (moodValues[entry.mood as keyof typeof moodValues] || 3), 0) / journalData.length
        : 3;

      // Use CRM stats data
      const crmData = crmStats.data || {};
      const clientsData = clients.data || clients || [];
      const tasksData = tasks.data || tasks || [];
      const eventsData = events.data || events || [];

      setStats({
        totalClients: crmData.totalClients || clientsData.length || 0,
        activeDeals: crmData.activeDeals || 0,
        completedTasks: tasksData.filter((task: any) => task.completed || task.status === 'completed').length || 0,
        upcomingEvents: eventsData.filter((event: any) => new Date(event.date || event.start_time) > new Date()).length || 0,
        totalRevenue: crmData.totalRevenue || 0,
        conversionRate: crmData.conversionRate || 0,
        totalEntries: journalData.length || 0,
        avgMood: parseFloat(avgMood.toFixed(1)),
        aiInsights: 0 // Real AI insights count will be implemented later
      });

      // Create recent activity from actual data
      const recentActivities: RecentActivity[] = [];
      
      // Add recent clients
      const recentClients = clientsData.slice(-2);
      recentClients.forEach((client: any) => {
        recentActivities.push({
          id: `client-${client.id}`,
          type: 'client',
          description: `New client added: ${client.company_name || client.name}`,
          time: '2 hours ago'
        });
      });

      // Add recent deals (from clients with deal_value)
      const recentDeals = clientsData.filter((client: any) => client.deal_value).slice(-2);
      recentDeals.forEach((client: any) => {
        recentActivities.push({
          id: `deal-${client.id}`,
          type: 'deal',
          description: `Deal updated: $${parseFloat(client.deal_value || 0).toLocaleString()}`,
          time: '4 hours ago',
          client: client.company_name || 'Unknown Client'
        });
      });

      // Add recent journal entries
      const recentJournals = journalData.slice(-1);
      recentJournals.forEach((entry: any) => {
        recentActivities.push({
          id: `journal-${entry.id}`,
          type: 'journal',
          description: `New journal entry: ${entry.category}`,
          time: '1 day ago'
        });
      });

      setRecentActivity(recentActivities.slice(0, 5)); // Show only 5 most recent
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      // Set default values on error
      setStats({
        totalClients: 0,
        activeDeals: 0,
        completedTasks: 0,
        upcomingEvents: 0,
        totalRevenue: 0,
        conversionRate: 0,
        totalEntries: 0,
        avgMood: 3,
        aiInsights: 0
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
    }
  }

  const generateDailyInsight = async () => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'You are Empty AI for the Empty CRM Personal system. Based on my CRM data from this system only and current business activities, provide a brief daily insight or recommendation for what I should focus on today. Keep it concise and actionable. Do not reference external CRM systems like Salesforce or HubSpot.',
          context: []
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.message) {
          setDailyInsight({
            message: data.data.message,
            priority: 'medium',
            type: 'insight'
          });
        }
      }
    } catch (error) {
      console.error('Failed to generate daily insight:', error);
      // No fallback insight - let it remain null if AI fails
      setDailyInsight(null);
    }
  }

  const statCards = [
    {
      name: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'bg-pink-500',
      bgColor: 'bg-pink-50'
    },
    {
      name: 'Active Deals',
      value: stats.activeDeals,
      icon: Target,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      name: 'Completed Tasks',
      value: stats.completedTasks,
      icon: CheckCircle,
      color: 'bg-green-500',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Upcoming Events',
      value: stats.upcomingEvents,
      icon: Calendar,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Total Revenue',
      value: formatCurrency(typeof stats.totalRevenue === 'number' ? stats.totalRevenue : 0),
      icon: DollarSign,
      color: 'bg-emerald-500',
      bgColor: 'bg-emerald-50'
    },
    {
      name: 'Conversion Rate',
      value: `${(typeof stats.conversionRate === 'number' ? stats.conversionRate : 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50'
    }
  ];

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-skeleton">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-container h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Stats Grid */}
      <div className="section-container">
        <div className="grid-responsive">
          {statCards.map((stat) => (
            <div key={stat.name} className="card-container hover:shadow-md transition-shadow touch-manipulation">
              <div className="flex items-center">
                <div className={`${stat.bgColor} p-2 sm:p-3 rounded-lg`}>
                  <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                   <p className="text-xs sm:text-sm font-medium text-secondary truncate">{stat.name}</p>
                   <p className="text-lg sm:text-2xl font-bold text-primary truncate">{stat.value}</p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-container">
        <div className="grid-standard grid-cols-1 xl:grid-cols-2">
          {/* Recent Activity */}
          <div className="card-container">
            <div className="card-header">
              <h2 className="text-base sm:text-lg font-semibold text-primary">Recent Activity</h2>
            </div>
            <div className="card-body">
              {recentActivity.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3 touch-manipulation">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-primary">{activity.description}</p>
                        <p className="text-xs text-muted">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted text-center py-6 sm:py-8 text-sm">No recent activity</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card-container">
            <div className="card-header">
              <h2 className="text-base sm:text-lg font-semibold text-primary">Quick Actions</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <button 
                  onClick={() => navigate('/crm')}
                  className="btn-secondary flex flex-col items-center min-h-[100px] sm:min-h-[120px] touch-manipulation"
                >
                  <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-primary text-center">Add Client</span>
                  <span className="text-xs text-muted text-center hidden sm:block">Create new client record</span>
                </button>

                <button 
                  onClick={() => navigate('/calendar')}
                  className="btn-secondary flex flex-col items-center min-h-[100px] sm:min-h-[120px] touch-manipulation"
                >
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-primary text-center">Schedule Meeting</span>
                  <span className="text-xs text-muted text-center hidden sm:block">Book a new appointment</span>
                </button>

                <button 
                  onClick={() => navigate('/journal')}
                  className="btn-secondary flex flex-col items-center min-h-[100px] sm:min-h-[120px] touch-manipulation"
                >
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-primary text-center">New Journal Entry</span>
                  <span className="text-xs text-muted text-center hidden sm:block">Write a journal entry</span>
                </button>

                <button 
                  onClick={() => navigate('/analytics')}
                  className="btn-secondary flex flex-col items-center min-h-[100px] sm:min-h-[120px] touch-manipulation"
                >
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-primary text-center">View Analytics</span>
                  <span className="text-xs text-muted text-center hidden sm:block">Check performance metrics</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}