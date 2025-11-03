import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import { crmApi, calendarApi, journalApi } from '../../lib/api'
import { 
  Users, 
  Calendar, 
  CheckSquare, 
  TrendingUp, 
  Plus,
  FileText,
  BarChart3,
  Target,
  CheckCircle,
  DollarSign
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
  // Default currency formatting
  const formatCurrency = (amount: number | undefined | null) => `$${(amount || 0).toLocaleString()}`;
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeDeals: 0,
    completedTasks: 0,
    upcomingEvents: 0,
    totalRevenue: 0,
    conversionRate: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initializeDashboard = async () => {
        // Wait for user to be fully loaded
        if (!user?.id) {
          return;
        }
      
      // Add a small delay to ensure authentication is fully settled
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check if component is still mounted before proceeding
      if (!isMounted) return;
      
      try {
        await fetchStats();
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      }
    };
    
    initializeDashboard();
    
    return () => {
      isMounted = false;
    };
  }, [user?.id]);



  const fetchStats = async () => {
    console.log('Dashboard.tsx - fetchStats called');
    
    // Ensure user is authenticated before making API calls
    if (!user?.id) {
      console.log('Dashboard.tsx - User not authenticated, skipping API calls');
      return;
    }
    
    try {
      console.log('Dashboard.tsx - Making API calls...');
      const [crmStats, clients, tasks, events, journalEntries] = await Promise.all([
        crmApi.getStats(),
        crmApi.getClients(),
        calendarApi.getTasks(),
        calendarApi.getEvents(),
        journalApi.getEntries()
      ]);
      console.log('Dashboard.tsx - API calls completed');
      console.log('Dashboard.tsx - Data received:', {
        crmStats: !!crmStats,
        clients: clients?.length || 0,
        tasks: tasks?.length || 0,
        events: events?.length || 0,
        journal: journalEntries?.length || 0
      });

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
      
      const journalData = Array.isArray(journalEntries) ? journalEntries : ((journalEntries as any)?.data || []);
      const avgMood = journalData.length > 0 
        ? Array.isArray(journalData) ? journalData.reduce((sum: number, entry: any) => sum + (moodValues[entry.mood as keyof typeof moodValues] || 3), 0) / journalData.length : 3
        : 3;

      // Use CRM stats data
      const crmData = (crmStats as any)?.data || crmStats || {};
      const clientsData = Array.isArray(clients) ? clients : ((clients as any)?.data || []);
      const tasksData = Array.isArray(tasks) ? tasks : ((tasks as any)?.data || []);
      const eventsData = Array.isArray(events) ? events : ((events as any)?.data || []);

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
      color: 'bg-primary-500',
      bgColor: 'bg-primary-50'
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-loose mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-32"></div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-loose">
          {statCards.map((stat) => (
            <div key={stat.name} className="card card-body hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className={`${stat.bgColor} p-compact rounded-lg`}>
                  <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} />
                </div>
                <div className="ml-4 min-w-0 flex-1">
                   <p className="text-sm font-medium text-gray-600 truncate">{stat.name}</p>
                   <p className="text-2xl font-bold text-gray-900 truncate">{stat.value}</p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </div>



      <div className="section-container">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-loose">
          {/* Recent Activity */}
          <div className="card">
            <div className="p-loose border-b border-light">
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            </div>
            <div className="p-loose">
              {recentActivity.length > 0 ? (
                <div className="space-standard">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-compact">
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-primary-500 rounded-full mt-2"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.description}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8 text-sm">No recent activity</p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="p-loose border-b border-light">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-loose">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-standard">
                <button 
                  onClick={() => navigate('/crm')}
                  className="btn btn-secondary flex flex-col items-center p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] hover:bg-primary-50 hover:border-primary-200 transition-colors"
                >
                  <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">Add Client</span>
                  <span className="text-xs text-gray-500 text-center mt-1 hidden sm:block">Create new client record</span>
                </button>

                <button 
                  onClick={() => navigate('/calendar')}
                  className="btn btn-secondary flex flex-col items-center p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] hover:bg-green-50 hover:border-green-200 transition-colors"
                >
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">Schedule Meeting</span>
                  <span className="text-xs text-gray-500 text-center mt-1 hidden sm:block">Book a new appointment</span>
                </button>

                <button 
                  onClick={() => navigate('/journal')}
                  className="btn btn-secondary flex flex-col items-center p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] hover:bg-purple-50 hover:border-purple-200 transition-colors"
                >
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">New Journal Entry</span>
                  <span className="text-xs text-gray-500 text-center mt-1 hidden sm:block">Write a journal entry</span>
                </button>

                <button 
                  onClick={() => navigate('/analytics')}
                  className="btn btn-secondary flex flex-col items-center p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] hover:bg-orange-50 hover:border-orange-200 transition-colors"
                >
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600 mb-2" />
                  <span className="text-xs sm:text-sm font-medium text-gray-900 text-center">View Analytics</span>
                  <span className="text-xs text-gray-500 text-center mt-1 hidden sm:block">Check performance metrics</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}