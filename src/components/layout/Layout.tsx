import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { crmApi } from '@/lib/api';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BookOpen,
  BarChart3,
  User,
  LogOut,
  Menu,
  X,
  DollarSign,
  FileText,
  TrendingUp
} from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'CRM', href: '/crm', icon: Users },
  { name: 'Financial', href: '/financial', icon: DollarSign },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Calendar', href: '/calendar', icon: Calendar },
  { name: 'Journal', href: '/journal', icon: BookOpen },
  { name: 'Profile', href: '/profile', icon: User },
];

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const fetchUserProfile = async () => {
    if (user?.id) {
      try {
        // Use API instead of direct Supabase call to handle both demo and real users
        const response = await crmApi.getUsers();
        
        // Handle both old format (direct array) and new format ({success: true, data: []})
        const userData = Array.isArray(response) ? response : ((response as any)?.data || []);
        
        if (!Array.isArray(userData)) {
          console.error('Users data is not an array:', userData);
          throw new Error('Invalid users data format');
        }
        
        const currentUser = userData.find((u: any) => u.id === user.id);
        
        if (currentUser) {
          setUserProfile(currentUser);
        } else {
          // Fallback to user metadata if not found in database
          setUserProfile({
            full_name: user.user_metadata?.name || '',
            email: user.email || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user profile in Layout:', error);
        // Fallback to user metadata on error
        setUserProfile({
          full_name: user.user_metadata?.name || '',
          email: user.email || ''
        });
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchUserProfile();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch (error) {
      toast.error('Error signing out');
    }
  };

  return (
    <div className="page-container">
      {/* Mobile header */}
      <div className="md:hidden bg-white shadow-sm border-b border-light safe-area-top fixed top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 min-h-[56px] sm:min-h-[60px]">
          <div className="flex items-center flex-1 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="touch-target p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 active:bg-gray-200 transition-colors flex-shrink-0"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <h1 className="ml-2 sm:ml-3 text-base sm:text-lg font-semibold text-primary truncate">CRM</h1>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <span className="text-xs sm:text-sm font-medium text-secondary truncate max-w-16 sm:max-w-24 hidden xs:block">
              {userProfile?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
            </span>
            <button
              onClick={handleSignOut}
              className="touch-target p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 active:bg-gray-200 transition-colors flex-shrink-0"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-50 md:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity" onClick={() => setSidebarOpen(false)} />
        <div className={`relative flex-1 flex flex-col max-w-xs sm:max-w-sm w-full bg-white transform transition-transform duration-300 ease-in-out safe-area-top safe-area-bottom ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-2 right-2 z-10">
            <button
              className="touch-target flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 active:bg-gray-300 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          <div className="flex-1 h-0 pt-14 sm:pt-16 pb-4 overflow-y-auto mobile-scroll">
            <div className="flex-shrink-0 flex items-center px-4 sm:px-6 min-h-[50px] sm:min-h-[60px]">
              <h1 className="text-lg sm:text-xl font-bold text-primary">CRM</h1>
            </div>
            <nav className="mt-4 sm:mt-6 px-3 sm:px-4 space-y-1 sm:space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border-primary-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base font-medium rounded-lg touch-target transition-all duration-200 border`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                      } mr-2.5 sm:mr-3 flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-light p-4 safe-area-bottom">
            <div className="flex items-center w-full">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <button
                  onClick={handleSignOut}
                  className="touch-target text-sm font-medium text-gray-600 hover:text-gray-900 active:text-primary-600 transition-colors py-1 mt-1"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 lg:w-72 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-6 lg:px-8 min-h-[60px]">
              <h1 className="text-xl lg:text-2xl font-bold text-primary-600">CRM</h1>
            </div>
            <nav className="mt-6 lg:mt-8 flex-1 px-4 lg:px-6 bg-white space-y-2">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border-primary-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    } group flex items-center px-3 lg:px-4 py-2.5 lg:py-3 text-sm lg:text-base font-medium rounded-lg transition-all duration-200 border`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                      } mr-3 lg:mr-4 flex-shrink-0 h-5 w-5 lg:h-6 lg:w-6`}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
            <div className="flex items-center w-full">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {userProfile?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'}
                </p>
                <button
                  onClick={handleSignOut}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900 active:text-primary-600 transition-colors py-1 mt-1"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 lg:pl-72 flex flex-col flex-1">
        <main className="flex-1 pt-16 md:pt-0">
          <div className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}