import React, { useState, useEffect } from 'react';
import { Event as CalendarEvent, Task } from '@/lib/supabase';
import { calendarApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

import AddEventModal from './AddEventModal';
import AddTaskModal from './AddTaskModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import SharedTasksSection from '@/components/SharedTasksSection';
import CollaborativeTaskBoard from '@/components/CollaborativeTaskBoard';
import TimelineDashboard from '@/components/TimelineDashboard';
import ClientTimeline from '@/components/ClientTimeline';
import TaskGroupManager from '@/components/TaskGroupManager';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  CheckCircle,
  Circle,
  Edit,
  Trash2,
  Grid3X3,
  Columns,
  Square,
  Activity,
  FolderOpen,
  Flag
} from 'lucide-react';
import { toast } from "sonner";

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  tasks: Task[];
}

type CalendarView = 'month' | 'week' | 'day';

export default function Calendar() {
  console.log('Calendar component loaded');
  const { user } = useAuth();
  // Default date and time formatting
  const formatDate = (date: Date) => date.toLocaleDateString();
  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDateTime = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [currentView, setCurrentView] = useState<CalendarView | 'shared' | 'timeline' | 'client-timeline' | 'task-groups'>('month');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteType, setDeleteType] = useState<'event' | 'task' | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, user]);

  // Real-time subscriptions
  useEffect(() => {

    // Load both shared and personal calendar data
    const loadAllCalendarData = async () => {
      try {
        const [sharedEventsData, personalEventsData] = await Promise.all([
          calendarApi.getEvents({ type: 'shared' }),
          calendarApi.getEvents({ type: 'personal' })
        ]);
        
        // Ensure data is always an array
        const sharedEvents = Array.isArray(sharedEventsData) ? sharedEventsData : [];
        const personalEvents = Array.isArray(personalEventsData) ? personalEventsData : [];
        
        // Combine shared and personal events
        const allEvents = [...sharedEvents, ...personalEvents];
        setEvents(allEvents);
        
        // Also fetch tasks (keeping existing logic)
        try {
          const tasksResponse = await calendarApi.getTasks();
          const tasksArray = Array.isArray(tasksResponse) ? tasksResponse : [];
          setTasks(tasksArray);
        } catch (error) {
          console.error('Error fetching tasks:', error);
        }
      } catch (error) {
        console.error('Error loading calendar data:', error);
        setEvents([]);
        setTasks([]);
      }
    };
    
    loadAllCalendarData();

    // Subscribe to events changes
    const eventsSubscription = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        (payload) => {
          console.log('Events change received:', payload);
          loadAllCalendarData(); // Refresh data on any change
        }
      )
      .subscribe();

    // Subscribe to tasks changes
    const tasksSubscription = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks'
        },
        (payload) => {
          console.log('Tasks change received:', payload);
          loadAllCalendarData(); // Refresh data on any change
        }
      )
      .subscribe();

    // Subscribe to shared tasks changes
    const sharedTasksSubscription = supabase
      .channel('shared-tasks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_tasks'
        },
        (payload) => {
          console.log('Shared tasks change received:', payload);
          loadAllCalendarData(); // Refresh data on any change
        }
      )
      .subscribe();

    // Subscribe to task groups changes
    const taskGroupsSubscription = supabase
      .channel('task-groups-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'task_groups'
        },
        (payload) => {
          console.log('Task groups change received:', payload);
          loadAllCalendarData(); // Refresh data on any change
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      eventsSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
      sharedTasksSubscription.unsubscribe();
      taskGroupsSubscription.unsubscribe();
    };
  }, [user]);

  const fetchCalendarData = async () => {

    try {
      setLoading(true);
      
      // Fetch events (both shared and personal by default)
      // The API now handles data separation automatically
      const eventsData = await calendarApi.getEvents();
      
      // Fetch tasks
      const tasksData = await calendarApi.getTasks();
      console.log('Fetched tasks data:', tasksData);

      // Ensure data is always an array
      const eventsArray = Array.isArray(eventsData) ? eventsData : [];
      const tasksArray = Array.isArray(tasksData) ? tasksData : [];
      console.log('Tasks array length:', tasksArray.length);
      
      setEvents(eventsArray);
      setTasks(tasksArray);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to fetch calendar data');
      // Set empty arrays on error to prevent filter issues
      setEvents([]);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch only shared events
  const fetchSharedEvents = async () => {

    try {
      setLoading(true);
      const eventsData = await calendarApi.getEvents({ type: 'shared' });
      const eventsArray = Array.isArray(eventsData) ? eventsData : [];
      setEvents(eventsArray);
      return eventsArray;
    } catch (error) {
      console.error('Error fetching shared events:', error);
      toast.error('Failed to fetch shared events');
      setEvents([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch only personal events
  const fetchPersonalEvents = async () => {

    try {
      setLoading(true);
      const eventsData = await calendarApi.getEvents({ type: 'personal' });
      const eventsArray = Array.isArray(eventsData) ? eventsData : [];
      setEvents(eventsArray);
      return eventsArray;
    } catch (error) {
      console.error('Error fetching personal events:', error);
      toast.error('Failed to fetch personal events');
      setEvents([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dateStr = date.toISOString().split('T')[0];
      // Ensure arrays before filtering
      const eventsArray = Array.isArray(events) ? events : [];
      const tasksArray = Array.isArray(tasks) ? tasks : [];
      
      const dayEvents = eventsArray.filter(event => {
        const eventDate = new Date(event.start_time).toISOString().split('T')[0];
        return eventDate === dateStr;
      });
      
      const dayTasks = tasksArray.filter(task => task.due_date === dateStr);

      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        events: dayEvents,
        tasks: dayTasks
      });
    }

    return days;
  };

  const generateWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start_time);
        return eventDate.toDateString() === date.toDateString();
      });
      
      const dayTasks = tasks.filter(task => {
        const taskDate = new Date(task.due_date);
        return taskDate.toDateString() === date.toDateString();
      });

      days.push({
        date,
        isToday: date.toDateString() === new Date().toDateString(),
        events: dayEvents,
        tasks: dayTasks
      });
    }
    return days;
  };

  const getDayData = () => {
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.start_time);
      return eventDate.toDateString() === currentDate.toDateString();
    });
    
    const dayTasks = tasks.filter(task => {
      const taskDate = new Date(task.due_date);
      return taskDate.toDateString() === currentDate.toDateString();
    });

    return {
      date: currentDate,
      isToday: currentDate.toDateString() === new Date().toDateString(),
      events: dayEvents,
      tasks: dayTasks
    };
  };

  const getViewTitle = () => {
    if (currentView === 'month') {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (currentView === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return `${MONTHS[startOfWeek.getMonth()]} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      } else {
        return `${MONTHS[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${MONTHS[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
      }
    } else {
      return `${MONTHS[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    }
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (currentView === 'month') {
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
    } else if (currentView === 'week') {
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() + 7);
      }
    } else if (currentView === 'day') {
      if (direction === 'prev') {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
    }
    setCurrentDate(newDate);
  };

  const toggleTaskComplete = async (task: Task) => {
    try {
      await calendarApi.updateTask(task.id, { completed: !task.completed });

      setTasks(tasks.map(t => 
        t.id === task.id ? { ...t, completed: !t.completed } : t
      ));
      toast.success(task.completed ? 'Task marked as incomplete' : 'Task completed!');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteClick = (id: string, type: 'event' | 'task') => {
    setItemToDelete(id);
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete || !deleteType) return;

    setDeleteLoading(true);
    try {
      if (deleteType === 'event') {
        await calendarApi.deleteEvent(itemToDelete);
        setEvents(events.filter(e => e.id !== itemToDelete));
        toast.success('Event deleted successfully');
      } else {
        await calendarApi.deleteTask(itemToDelete);
        setTasks(tasks.filter(t => t.id !== itemToDelete));
        toast.success('Task deleted successfully');
      }
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleteType(null);
    } catch (error) {
      console.error(`Error deleting ${deleteType}:`, error);
      toast.error(`Failed to delete ${deleteType}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
    setDeleteType(null);
  };

  const calendarDays = generateCalendarDays();
  
  // Ensure arrays before filtering
  const eventsArray = Array.isArray(events) ? events : [];
  const tasksArray = Array.isArray(tasks) ? tasks : [];
  
  const upcomingEvents = eventsArray
    .filter(event => new Date(event.start_time) >= new Date())
    .slice(0, 5);
  const upcomingTasks = tasksArray
    .filter(task => !task.completed && new Date(task.due_date) >= new Date())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="p-6">
        <div className="loading-skeleton">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="card">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-7 gap-4">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-50 rounded"></div>
            ))}
          </div>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
            <p className="text-gray-600">Manage your events and tasks</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* View Toggle */}
            <div className="flex overflow-x-auto gap-2 pb-2 sm:pb-0 w-full sm:w-auto">
              <div className="flex flex-wrap gap-2 min-w-max">
              <button
                onClick={() => setCurrentView('month')}
                className={`px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm flex items-center gap-1 ${
                  currentView === 'month'
                    ? 'btn btn-primary'
                    : 'btn btn-secondary'
                }`}
              >
                <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Month</span>
              </button>
              <button
                onClick={() => setCurrentView('week')}
                className={`px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                  currentView === 'week'
                    ? 'btn btn-primary'
                    : 'btn btn-secondary'
                }`}
              >
                <span className="hidden xs:inline">Week</span>
                <span className="xs:hidden">W</span>
              </button>
              <button
                onClick={() => setCurrentView('day')}
                className={`px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
                  currentView === 'day'
                    ? 'btn btn-primary'
                    : 'btn btn-secondary'
                }`}
              >
                <span className="hidden xs:inline">Day</span>
                <span className="xs:hidden">D</span>
              </button>
              <button
                onClick={() => setCurrentView('shared')}
                className={`px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm flex items-center gap-1 ${
                  currentView === 'shared'
                    ? 'btn btn-primary'
                    : 'btn btn-secondary'
                }`}
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Shared</span>
              </button>
              <button
                onClick={() => setCurrentView('timeline')}
                className={`px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm flex items-center gap-1 ${
                  currentView === 'timeline'
                    ? 'btn btn-primary'
                    : 'btn btn-secondary'
                }`}
              >
                <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Timeline</span>
              </button>
              <button
                onClick={() => setCurrentView('client-timeline')}
                className={`px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm flex items-center gap-1 ${
                  currentView === 'client-timeline'
                    ? 'btn btn-primary'
                    : 'btn btn-secondary'
                }`}
              >
                <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden lg:inline">Client Timeline</span>
                <span className="lg:hidden hidden sm:inline">Client</span>
              </button>
              <button
                onClick={() => setCurrentView('task-groups')}
                className={`px-2 sm:px-3 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm flex items-center gap-1 ${
                  currentView === 'task-groups'
                    ? 'btn btn-primary'
                    : 'btn btn-secondary'
                }`}
              >
                <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden lg:inline">Task Groups</span>
                <span className="lg:hidden hidden sm:inline">Tasks</span>
              </button>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
                className="btn btn-primary flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span className="sm:inline">Add Task</span>
              </button>
              <button
                onClick={() => {
                  setEditingEvent(null);
                  setShowEventModal(true);
                }}
                className="btn btn-primary flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span className="sm:inline">Add Event</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-3 sm:gap-4 lg:gap-6">
        {/* Calendar */}
        <div className="order-1 xl:order-none xl:flex-1 min-w-0">
          <div className="card">
            <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-light">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 min-w-0">
                  {getViewTitle()}
                </h2>
                <div className="flex justify-center sm:justify-end space-x-1 sm:space-x-2">
                  <button
                    onClick={() => navigateDate('prev')}
                    className="btn btn-secondary p-1.5 sm:p-2 rounded-lg min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px]"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="btn btn-secondary text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg min-h-[40px] sm:min-h-[44px]"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateDate('next')}
                    className="btn btn-secondary p-1.5 sm:p-2 rounded-lg min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px]"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-6">
              {/* Month View */}
              {currentView === 'month' && (
                <>
                  {/* Days header */}
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
                    {DAYS.map(day => (
                      <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500">
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.charAt(0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                    {calendarDays.map((day, index) => (
                      <div
                        key={index}
                        className={`min-h-[60px] sm:min-h-[80px] md:min-h-[90px] lg:min-h-[100px] xl:min-h-[110px] p-0.5 sm:p-1 lg:p-2 border-light rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          !day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                        } ${
                          day.isToday ? 'bg-pink-50 border-pink-200' : ''
                        }`}
                        onClick={() => {
                          setSelectedDate(day.date);
                          setEditingEvent(null);
                          setShowEventModal(true);
                        }}
                      >
                        <div className={`text-xs sm:text-sm font-medium mb-0.5 sm:mb-1 ${
                          day.isToday ? 'text-pink-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {day.date.getDate()}
                        </div>
                        
                        {/* Events */}
                        {day.events.slice(0, 1).map(event => (
                          <div
                            key={event.id}
                            className="text-xs bg-pink-100 text-pink-800 px-1 py-0.5 rounded mb-0.5 truncate cursor-pointer hover:bg-pink-200 min-h-[16px] sm:min-h-[18px] lg:min-h-[24px] flex items-center touch-manipulation"
                            title={event.title}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEvent(event);
                              setShowEventModal(true);
                            }}
                          >
                            {event.title}
                          </div>
                        ))}
                        
                        {/* Tasks */}
                        {day.tasks.slice(0, 1).map(task => (
                          <div
                            key={task.id}
                            className={`text-xs px-1 py-0.5 rounded mb-0.5 truncate cursor-pointer min-h-[16px] sm:min-h-[18px] lg:min-h-[24px] flex items-center touch-manipulation ${
                              task.completed 
                                ? 'bg-green-100 text-green-800 line-through hover:bg-green-200' 
                                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                            }`}
                            title={task.title}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTask(task);
                              setShowTaskModal(true);
                            }}
                          >
                            {task.title}
                          </div>
                        ))}
                        
                        {/* More indicator */}
                        {(day.events.length + day.tasks.length) > 2 && (
                          <div className="text-xs text-gray-500 px-0.5 sm:px-1">
                            +{(day.events.length + day.tasks.length) - 2}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Shared Tasks View */}
              {currentView === 'shared' && (
                <div className="space-y-6">
                  <SharedTasksSection currentUserId={user?.id || ''} />
                  <CollaborativeTaskBoard currentUserId={user?.id || ''} />
                </div>
              )}

              {/* Timeline View */}
              {currentView === 'timeline' && (
                <TimelineDashboard currentUserId={user?.id || ''} />
              )}

              {/* Client Timeline View */}
              {currentView === 'client-timeline' && (
                <ClientTimeline currentUserId={user?.id || ''} />
              )}

              {/* Task Groups View */}
              {currentView === 'task-groups' && (
                <TaskGroupManager currentUserId={user?.id || ''} />
              )}

              {/* Week View */}
              {currentView === 'week' && (
                <>
                  {/* Days header */}
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-2">
                    {DAYS.map(day => (
                      <div key={day} className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-gray-500">
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.charAt(0)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Week grid */}
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                    {generateWeekDays().map((day, index) => (
                      <div
                        key={index}
                        className={`min-h-[100px] sm:min-h-[120px] md:min-h-[140px] lg:min-h-[160px] xl:min-h-[180px] p-1 sm:p-2 lg:p-3 border-standard rounded-lg cursor-pointer hover:bg-gray-50 transition-colors touch-manipulation ${
                          day.isToday ? 'bg-pink-50 border-pink-200' : 'bg-white'
                        }`}
                        onClick={() => {
                          setCurrentDate(day.date);
                          setCurrentView('day');
                        }}
                      >
                        <div className={`text-sm sm:text-lg font-semibold mb-1 sm:mb-2 ${
                          day.isToday ? 'text-pink-600' : 'text-gray-900'
                        }`}>
                          {day.date.getDate()}
                        </div>
                        
                        {/* Events */}
                        <div className="space-y-0.5 sm:space-y-1 mb-1 sm:mb-2">
                          {day.events.map(event => (
                            <div
                              key={event.id}
                              className="text-xs bg-pink-100 text-pink-800 px-1 sm:px-2 py-0.5 sm:py-1 rounded cursor-pointer hover:bg-pink-200 truncate"
                              title={event.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEvent(event);
                                setShowEventModal(true);
                              }}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-xs opacity-75 hidden sm:block">
                                {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Tasks */}
                        <div className="space-y-0.5 sm:space-y-1">
                          {day.tasks.map(task => (
                            <div
                              key={task.id}
                              className={`text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded cursor-pointer truncate ${
                                task.completed 
                                  ? 'bg-green-100 text-green-800 line-through hover:bg-green-200' 
                                  : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                              }`}
                              title={task.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTask(task);
                                setShowTaskModal(true);
                              }}
                            >
                              <div className="font-medium truncate">{task.title}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Day View */}
              {currentView === 'day' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="text-center">
                    <div className={`text-lg sm:text-xl lg:text-2xl font-bold mb-2 ${
                      getDayData().isToday ? 'text-pink-600' : 'text-gray-900'
                    }`}>
                      <span className="hidden sm:inline">{DAYS[currentDate.getDay()]}</span>
                      <span className="sm:hidden">{DAYS[currentDate.getDay()].substring(0, 3)}</span>
                    </div>
                    <div className="text-xs sm:text-sm lg:text-base text-gray-600">
                      <span className="hidden sm:inline">{formatDateTime(currentDate)}</span>
                      <span className="sm:hidden">{formatDate(currentDate)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                    {/* Events */}
                    <div className="card card-body">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                        <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-pink-600" />
                        Events
                      </h3>
                      {getDayData().events.length === 0 ? (
                        <div className="text-center py-6 sm:py-8">
                          <CalendarIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No events today</p>
                          <button
                            onClick={() => {
                              setEditingEvent(null);
                              setShowEventModal(true);
                            }}
                            className="mt-2 text-pink-600 hover:text-pink-700 text-xs sm:text-sm font-medium"
                          >
                            Add an event
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {getDayData().events.map(event => (
                            <div
                              key={event.id}
                              className="card p-3 sm:p-4 border border-pink-200 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => {
                                setEditingEvent(event);
                                setShowEventModal(true);
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">{event.title}</h4>
                                  <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-1">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    {formatTime(new Date(event.start_time))} - {formatTime(new Date(event.end_time))}
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-1">
                                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                      {event.location}
                                    </div>
                                  )}
                                  {event.description && (
                                    <p className="text-xs sm:text-sm text-gray-600 mt-2">{event.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tasks */}
                    <div className="card card-body">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center">
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-purple-600" />
                        Tasks
                      </h3>
                      {getDayData().tasks.length === 0 ? (
                        <div className="text-center py-6 sm:py-8">
                          <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm">No tasks today</p>
                          <button
                            onClick={() => {
                              setEditingTask(null);
                              setShowTaskModal(true);
                            }}
                            className="mt-2 text-purple-600 hover:text-purple-700 text-xs sm:text-sm font-medium"
                          >
                            Add a task
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 sm:space-y-3">
                          {getDayData().tasks.map(task => (
                            <div
                              key={task.id}
                              className="card card-body border border-purple-200 cursor-pointer hover:shadow-md transition-shadow p-3 sm:p-4"
                              onClick={() => {
                        console.log('Task clicked:', task.title, 'Current showTaskModal:', showTaskModal);
                        setEditingTask(task);
                        setShowTaskModal(true);
                        console.log('After setting modal state - showTaskModal should be true');
                      }}
                            >
                              <div className="flex items-start space-x-2 sm:space-x-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTaskComplete(task);
                                  }}
                                  className="mt-0.5 text-purple-600 hover:text-purple-700"
                                >
                                  {task.completed ? (
                                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                  ) : (
                                    <Circle className="w-4 h-4 sm:w-5 sm:h-5" />
                                  )}
                                </button>
                                <div className="flex-1">
                                  <h4 className={`font-medium text-sm sm:text-base ${
                                    task.completed ? 'text-muted line-through' : 'text-primary'
                                  }`}>
                                    {task.title}
                                  </h4>
                                  {task.description && (
                                    <p className="text-xs sm:text-sm text-muted mt-1">{task.description}</p>
                                  )}
                                  <div className="flex items-center text-xs sm:text-sm text-muted mt-2">
                                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    Due: {formatDate(new Date(task.due_date))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full xl:w-80 xl:flex-shrink-0 space-y-3 sm:space-y-4 lg:space-y-6">
          {/* Upcoming Events */}
          <div className="card">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center">
                <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-pink-600" />
                <span className="hidden sm:inline">Upcoming Events</span>
                <span className="sm:hidden">Events</span>
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming events</p>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.map(event => (
                    <div key={event.id} className="flex items-start justify-between group">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{event.title}</p>
                        <div className="flex items-center text-xs text-gray-500 mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatDate(new Date(event.start_time))}
                        </div>
                        {event.location && (
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <MapPin className="w-3 h-3 mr-1" />
                            {event.location}
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingEvent(event);
                            setShowEventModal(true);
                          }}
                          className="btn btn-secondary p-1.5 rounded-md"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(event.id, 'event')}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Tasks */}
          <div className="card">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-purple-600" />
                <span className="hidden sm:inline">Upcoming Tasks</span>
                <span className="sm:hidden">Tasks</span>
              </h3>
            </div>
            <div className="p-4 sm:p-6">
              {upcomingTasks.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming tasks</p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map(task => (
                    <div key={task.id} className="flex items-start justify-between group">
                      <div className="flex items-start space-x-2 flex-1">
                        <button
                          onClick={() => toggleTaskComplete(task)}
                          className="mt-0.5 text-purple-600 hover:text-purple-700"
                        >
                          {task.completed ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                          }`}>
                            {task.title}
                          </p>
                          <div className="flex items-center text-xs text-gray-500 mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDate(new Date(task.due_date))}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingTask(task);
                            setShowTaskModal(true);
                          }}
                          className="btn btn-secondary p-1.5 rounded-md"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(task.id, 'task')}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Modals */}
      <AddEventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
        }}
        onEventAdded={() => fetchCalendarData()}
        onEventDeleted={(eventId) => {
          setEvents(events.filter(e => e.id !== eventId));
          fetchCalendarData();
        }}
        editEvent={editingEvent}
      />

      <AddTaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onTaskAdded={() => fetchCalendarData()}
        onTaskDeleted={(taskId) => {
          setTasks(tasks.filter(t => t.id !== taskId));
          fetchCalendarData();
        }}
        editTask={editingTask}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${deleteType === 'event' ? 'Event' : 'Task'}`}
        message={`Are you sure you want to delete this ${deleteType}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
}