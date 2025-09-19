import React, { useState, useEffect } from 'react'
import { Calendar, Clock, User, CheckCircle, Circle, AlertCircle, Filter, Search, ChevronDown, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface TimelineItem {
  id: string
  type: 'task' | 'event' | 'shared_task'
  title: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  start_date: string
  end_date?: string
  due_date?: string
  client_id?: string
  assigned_to?: string
  created_by?: string
  created_at: string
  updated_at: string
  client?: {
    id: string
    company_name: string
  }
  assignee?: {
    id: string
    name: string
    email: string
  }
  creator?: {
    id: string
    name: string
    email: string
  }
}

interface TimelineDashboardProps {
  currentUserId: string
}

const TimelineDashboard: React.FC<TimelineDashboardProps> = ({ currentUserId }) => {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'all' | 'tasks' | 'events' | 'shared'>('all')
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter'>('month')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchTimelineData()
    
    // Set up real-time subscriptions
    const tasksSubscription = supabase
      .channel('tasks_changes_timeline')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks'
      }, () => {
        fetchTimelineData()
      })
      .subscribe()

    const eventsSubscription = supabase
      .channel('events_changes_timeline')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'calendar_events'
      }, () => {
        fetchTimelineData()
      })
      .subscribe()

    const sharedTasksSubscription = supabase
      .channel('shared_tasks_changes_timeline')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shared_tasks'
      }, () => {
        fetchTimelineData()
      })
      .subscribe()

    return () => {
      tasksSubscription.unsubscribe()
      eventsSubscription.unsubscribe()
      sharedTasksSubscription.unsubscribe()
    }
  }, [dateRange, viewMode])

  const fetchTimelineData = async () => {
    try {
      setLoading(true)
      const now = new Date()
      let startDate: Date
      let endDate: Date

      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7)
          break
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0)
          break
        default: // month
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      }

      const items: TimelineItem[] = []

      // Fetch tasks if needed
      if (viewMode === 'all' || viewMode === 'tasks') {
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            *,
            client:clients!tasks_client_id_fkey(id, company_name),
            assignee:users!tasks_assigned_to_fkey(id, name, email)
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false })

        if (tasksError) throw tasksError
        
        tasks?.forEach(task => {
          items.push({
            ...task,
            type: 'task',
            start_date: task.created_at
          })
        })
      }

      // Fetch events if needed
      if (viewMode === 'all' || viewMode === 'events') {
        const { data: events, error: eventsError } = await supabase
          .from('calendar_events')
          .select(`
            *,
            client:clients!calendar_events_client_id_fkey(id, company_name)
          `)
          .gte('start_time', startDate.toISOString())
          .lte('start_time', endDate.toISOString())
          .order('start_time', { ascending: false })

        if (eventsError) throw eventsError
        
        events?.forEach(event => {
          items.push({
            ...event,
            type: 'event'
          })
        })
      }

      // Fetch shared tasks if needed
      if (viewMode === 'all' || viewMode === 'shared') {
        const { data: sharedTasks, error: sharedError } = await supabase
          .from('shared_tasks')
          .select(`
            *,
            task:tasks!shared_tasks_task_id_fkey(
              id,
              title,
              description,
              status,
              priority,
              due_date,
              client:clients!tasks_client_id_fkey(id, company_name),
              assignee:users!tasks_assigned_to_fkey(id, name, email)
            ),
            user:users!shared_tasks_shared_with_fkey(id, name, email)
          `)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString())
          .order('created_at', { ascending: false })

        if (sharedError) throw sharedError
        
        sharedTasks?.forEach(sharedTask => {
          items.push({
            ...sharedTask,
            type: 'shared_task',
            title: sharedTask.task?.title || 'Shared Task',
            description: sharedTask.task?.description || '',
            status: sharedTask.task?.status || 'pending',
            priority: sharedTask.task?.priority || 'medium',
            start_date: sharedTask.created_at,
            client: sharedTask.task?.client,
            assignee: sharedTask.task?.assignee
          })
        })
      }

      // Sort all items by date
      items.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
      
      setTimelineItems(items)
    } catch (error) {
      console.error('Error fetching timeline data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = timelineItems.filter(item => {
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  const groupItemsByDate = (items: TimelineItem[]) => {
    const groups: { [key: string]: TimelineItem[] } = {}
    
    items.forEach(item => {
      const date = new Date(item.start_date).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(item)
    })
    
    return groups
  }

  const toggleDayExpansion = (date: string) => {
    const newExpanded = new Set(expandedDays)
    if (newExpanded.has(date)) {
      newExpanded.delete(date)
    } else {
      newExpanded.add(date)
    }
    setExpandedDays(newExpanded)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task': return <Circle className="w-4 h-4 text-blue-600" />
      case 'event': return <Calendar className="w-4 h-4 text-green-600" />
      case 'shared_task': return <User className="w-4 h-4 text-purple-600" />
      default: return <Circle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress': return <AlertCircle className="w-4 h-4 text-yellow-600" />
      case 'pending': return <Circle className="w-4 h-4 text-gray-400" />
      default: return null
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-gray-300'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const groupedItems = groupItemsByDate(filteredItems)
  const sortedDates = Object.keys(groupedItems).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="section-container">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-primary">Timeline Dashboard</h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {filteredItems.length} items
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search timeline..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-standard w-full pl-10"
            />
          </div>

          {/* View Mode Filter */}
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="input-standard"
          >
            <option value="all">All Items</option>
            <option value="tasks">Tasks Only</option>
            <option value="events">Events Only</option>
            <option value="shared">Shared Tasks</option>
          </select>

          {/* Date Range Filter */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="input-standard"
          >
            <option value="week">Past & Next Week</option>
            <option value="month">Past & Next Month</option>
            <option value="quarter">Past & Next Quarter</option>
          </select>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">No timeline items found</h3>
            <p className="text-secondary">
              {searchTerm ? 'Try adjusting your search terms' : 'No activities in the selected time range'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map(date => {
              const dayItems = groupedItems[date]
              const isExpanded = expandedDays.has(date)
              const displayItems = isExpanded ? dayItems : dayItems.slice(0, 3)
              
              return (
                <div key={date} className="relative">
                  {/* Date Header */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="flex-shrink-0 w-3 h-3 bg-blue-600 rounded-full"></div>
                    <h3 className="text-lg font-medium text-primary">
                      {formatDate(date)}
                    </h3>
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <span className="text-sm text-muted">
                      {dayItems.length} {dayItems.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>

                  {/* Timeline Items */}
                  <div className="ml-6 space-y-3">
                    {displayItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`relative section-container border-l-4 ${getPriorityColor(item.priority)} hover:shadow-md transition-shadow p-4`}
                      >
                        {/* Connector Line */}
                        {index < displayItems.length - 1 && (
                          <div className="absolute left-0 top-full w-px h-3 bg-gray-200 ml-2"></div>
                        )}

                        <div className="flex items-start space-x-3">
                          {/* Type Icon */}
                          <div className="flex-shrink-0 mt-1">
                            {getTypeIcon(item.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-primary truncate">
                                    {item.title}
                                  </h4>
                                  {item.status && getStatusIcon(item.status)}
                                  <span className="text-xs text-muted capitalize">
                                    {item.type.replace('_', ' ')}
                                  </span>
                                </div>
                                
                                {item.description && (
                                  <p className="text-sm text-secondary mb-2 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center space-x-4 text-xs text-muted">
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{formatTime(item.start_date)}</span>
                                  </span>
                                  
                                  {item.client && (
                                    <span className="flex items-center space-x-1">
                                      <User className="w-3 h-3" />
                                      <span>{item.client.company_name}</span>
                                    </span>
                                  )}
                                  
                                  {item.assignee && (
                                    <span className="flex items-center space-x-1">
                                      <User className="w-3 h-3" />
                                      <span>Assigned to {item.assignee.name}</span>
                                    </span>
                                  )}
                                  
                                  {item.priority && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      item.priority === 'high' ? 'bg-red-100 text-red-800' :
                                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-green-100 text-green-800'
                                    }`}>
                                      {item.priority}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Show More/Less Button */}
                    {dayItems.length > 3 && (
                      <button
                        onClick={() => toggleDayExpansion(date)}
                        className="ml-6 flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="w-4 h-4" />
                            <span>Show less</span>
                          </>
                        ) : (
                          <>
                            <ChevronRight className="w-4 h-4" />
                            <span>Show {dayItems.length - 3} more items</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default TimelineDashboard