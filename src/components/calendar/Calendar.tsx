import React, { useState, useEffect } from 'react';
import { Event as CalendarEvent, Task } from '@/lib/supabase';
import { calendarApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/contexts/SettingsContext';
import AddEventModal from './AddEventModal';
import AddTaskModal from './AddTaskModal';
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
  const { user } = useAuth();
  const { formatDate, formatTime, formatDateTime } = useSettings();
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

  useEffect(() => {
    fetchCalendarData();
  }, [currentDate, user]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to events changes
    const eventsSubscription = supabase
      .channel('events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Events change received:', payload);
          fetchCalendarData(); // Refresh data on any change
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
          table: 'tasks',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Tasks change received:', payload);
          fetchCalendarData(); // Refresh data on any change
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
          fetchCalendarData(); // Refresh data on any change
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
          fetchCalendarData(); // Refresh data on any change
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
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch events
      const eventsData = await calendarApi.getEvents();
      
      // Fetch tasks
      const tasksData = await calendarApi.getTasks();

      // Ensure data is always an array
      const eventsArray = Array.isArray(eventsData) ? eventsData : [];
      const tasksArray = Array.isArray(tasksData) ? tasksData : [];
      
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

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      await calendarApi.deleteEvent(eventId);
      setEvents(events.filter(e => e.id !== eventId));
      toast.success('Event deleted successfully');
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      await calendarApi.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
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
          <div className="card-container">
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
      <div className="card-header mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar</h1>
            <p className="text-gray-600">Manage your events and tasks</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* View Toggle */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCurrentView('month')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentView === 'month'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                <CalendarIcon className="h-4 w-4 inline mr-1" />
                Month
              </button>
              <button
                onClick={() => setCurrentView('week')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentView === 'week'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setCurrentView('day')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentView === 'day'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setCurrentView('shared')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentView === 'shared'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                <Users className="h-4 w-4 inline mr-1" />
                Shared
              </button>
              <button
                onClick={() => setCurrentView('timeline')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentView === 'timeline'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                <Activity className="h-4 w-4 inline mr-1" />
                Timeline
              </button>
              <button
                onClick={() => setCurrentView('client-timeline')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentView === 'client-timeline'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                <Activity className="h-4 w-4 inline mr-1" />
                Client Timeline
              </button>
              <button
                onClick={() => setCurrentView('task-groups')}
                className={`px-3 py-2 rounded-lg font-medium transition-colors text-sm ${
                  currentView === 'task-groups'
                    ? 'btn-primary'
                    : 'btn-secondary'
                }`}
              >
                <FolderOpen className="h-4 w-4 inline mr-1" />
                Task Groups
              </button>
            </div>
            
            <button
              onClick={() => {
                setEditingTask(null);
                setShowTaskModal(true);
              }}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </button>
            <button
              onClick={() => {
                setEditingEvent(null);
                setShowEventModal(true);
              }}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <div className="card-container">
            <div className="card-header border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {getViewTitle()}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigateDate('prev')}
                    className="btn-secondary p-2"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="btn-secondary text-sm"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => navigateDate('next')}
                    className="btn-secondary p-2"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Month View */}
              {currentView === 'month' && (
                <>
                  {/* Days header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {DAYS.map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => (
                      <div
                        key={index}
                        className={`min-h-[100px] p-2 border border-gray-100 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
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
                        <div className={`text-sm font-medium mb-1 ${
                          day.isToday ? 'text-pink-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                        }`}>
                          {day.date.getDate()}
                        </div>
                        
                        {/* Events */}
                        {day.events.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded mb-1 truncate cursor-pointer hover:bg-pink-200"
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
                        {day.tasks.slice(0, 2).map(task => (
                          <div
                            key={task.id}
                            className={`text-xs px-2 py-1 rounded mb-1 truncate cursor-pointer ${
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
                        {(day.events.length + day.tasks.length) > 4 && (
                          <div className="text-xs text-gray-500">
                            +{(day.events.length + day.tasks.length) - 4} more
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
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {DAYS.map(day => (
                      <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Week grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {generateWeekDays().map((day, index) => (
                      <div
                        key={index}
                        className={`min-h-[200px] p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                          day.isToday ? 'bg-pink-50 border-pink-200' : 'bg-white'
                        }`}
                        onClick={() => {
                          setCurrentDate(day.date);
                          setCurrentView('day');
                        }}
                      >
                        <div className={`text-lg font-semibold mb-2 ${
                          day.isToday ? 'text-pink-600' : 'text-gray-900'
                        }`}>
                          {day.date.getDate()}
                        </div>
                        
                        {/* Events */}
                        <div className="space-y-1 mb-2">
                          {day.events.map(event => (
                            <div
                              key={event.id}
                              className="text-xs bg-pink-100 text-pink-800 px-2 py-1 rounded cursor-pointer hover:bg-pink-200"
                              title={event.title}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingEvent(event);
                                setShowEventModal(true);
                              }}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-xs opacity-75">
                                {new Date(event.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Tasks */}
                        <div className="space-y-1">
                          {day.tasks.map(task => (
                            <div
                              key={task.id}
                              className={`text-xs px-2 py-1 rounded cursor-pointer ${
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
                <div className="space-y-6">
                  <div className="text-center">
                    <div className={`text-2xl font-bold mb-2 ${
                      getDayData().isToday ? 'text-pink-600' : 'text-gray-900'
                    }`}>
                      {DAYS[currentDate.getDay()]}
                    </div>
                    <div className="text-gray-600">
                      {formatDateTime(currentDate)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Events */}
                    <div className="card-container">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CalendarIcon className="w-5 h-5 mr-2 text-pink-600" />
                        Events
                      </h3>
                      {getDayData().events.length === 0 ? (
                        <div className="text-center py-8">
                          <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No events today</p>
                          <button
                            onClick={() => {
                              setEditingEvent(null);
                              setShowEventModal(true);
                            }}
                            className="mt-2 text-pink-600 hover:text-pink-700 text-sm font-medium"
                          >
                            Add an event
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getDayData().events.map(event => (
                            <div
                              key={event.id}
                              className="card p-4 border border-pink-200 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => {
                                setEditingEvent(event);
                                setShowEventModal(true);
                              }}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{event.title}</h4>
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {formatTime(new Date(event.start_time))} - {formatTime(new Date(event.end_time))}
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center text-sm text-gray-500 mt-1">
                                      <MapPin className="w-4 h-4 mr-1" />
                                      {event.location}
                                    </div>
                                  )}
                                  {event.description && (
                                    <p className="text-sm text-gray-600 mt-2">{event.description}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Tasks */}
                    <div className="card-container">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-purple-600" />
                        Tasks
                      </h3>
                      {getDayData().tasks.length === 0 ? (
                        <div className="text-center py-8">
                          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500">No tasks today</p>
                          <button
                            onClick={() => {
                              setEditingTask(null);
                              setShowTaskModal(true);
                            }}
                            className="mt-2 text-purple-600 hover:text-purple-700 text-sm font-medium"
                          >
                            Add a task
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {getDayData().tasks.map(task => (
                            <div
                              key={task.id}
                              className="card-container border border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() => {
                                setEditingTask(task);
                                setShowTaskModal(true);
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTaskComplete(task);
                                  }}
                                  className="mt-0.5 text-purple-600 hover:text-purple-700"
                                >
                                  {task.completed ? (
                                    <CheckCircle className="w-5 h-5" />
                                  ) : (
                                    <Circle className="w-5 h-5" />
                                  )}
                                </button>
                                <div className="flex-1">
                                  <h4 className={`font-medium ${
                                    task.completed ? 'text-gray-500 line-through' : 'text-gray-900'
                                  }`}>
                                    {task.title}
                                  </h4>
                                  {task.description && (
                                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                                  )}
                                  <div className="flex items-center text-sm text-gray-500 mt-2">
                                    <Clock className="w-4 h-4 mr-1" />
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
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="card-container">
            <div className="card-header border-b">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <CalendarIcon className="w-4 h-4 mr-2 text-pink-600" />
                Upcoming Events
              </h3>
            </div>
            <div className="p-4">
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
                          className="btn-secondary"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteEvent(event.id)}
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
          <div className="card-container">
            <div className="card-header border-b">
              <h3 className="font-semibold text-gray-900 flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-purple-600" />
                Upcoming Tasks
              </h3>
            </div>
            <div className="p-4">
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
                          className="btn-secondary"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteTask(task.id)}
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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3 z-50">
        <button
          onClick={() => {
            setEditingEvent(null);
            setSelectedDate(currentDate);
            setShowEventModal(true);
          }}
          className="btn-primary p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 group"
          title="Add Event"
        >
          <CalendarIcon className="w-6 h-6" />
          <span className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Add Event
          </span>
        </button>
        
        <button
          onClick={() => {
            setEditingTask(null);
            setSelectedDate(currentDate);
            setShowTaskModal(true);
          }}
          className="btn-primary p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-105 group"
          title="Add Task"
        >
          <CheckCircle className="w-6 h-6" />
          <span className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white px-2 py-1 rounded text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Add Task
          </span>
        </button>
      </div>

      {/* Modals */}
      <AddEventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
        }}
        onEventAdded={() => fetchCalendarData()}
        editEvent={editingEvent}
      />

      <AddTaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onTaskAdded={() => fetchCalendarData()}
        editTask={editingTask}
      />
    </div>
  );
}