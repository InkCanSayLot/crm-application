import React, { useState, useEffect } from 'react'
import { User, Calendar, Clock, CheckCircle, Circle, AlertCircle, Phone, Mail, MessageSquare, FileText, Search, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Client {
  id: string
  company_name: string
  contact_name?: string
  email?: string
  phone?: string
  created_at: string
}

interface ClientActivity {
  id: string
  type: 'task' | 'event' | 'interaction' | 'note'
  title: string
  description?: string
  status?: 'pending' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  interaction_type?: 'call' | 'email' | 'meeting' | 'other'
  date: string
  created_at: string
  updated_at: string
  assignee?: {
    id: string
    name: string
    email: string
  }
}

interface ClientTimelineProps {
  clientId?: string
  currentUserId: string
}

const ClientTimeline: React.FC<ClientTimelineProps> = ({ clientId, currentUserId }) => {
  const [client, setClient] = useState<Client | null>(null)
  const [activities, setActivities] = useState<ClientActivity[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>(clientId || '')
  const [loading, setLoading] = useState(true)
  const [activityFilter, setActivityFilter] = useState<'all' | 'task' | 'event' | 'interaction' | 'note'>('all')
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'all'>('month')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchClients()
  }, [])

  useEffect(() => {
    if (selectedClientId) {
      fetchClientData()
      fetchClientActivities()
      
      // Set up real-time subscriptions for client activities
      const tasksSubscription = supabase
        .channel('tasks_changes_client_timeline')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'tasks'
        }, () => {
          fetchClientActivities()
        })
        .subscribe()

      const eventsSubscription = supabase
        .channel('events_changes_client_timeline')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'calendar_events'
        }, () => {
          fetchClientActivities()
        })
        .subscribe()

      const interactionsSubscription = supabase
        .channel('interactions_changes_client_timeline')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'interactions'
        }, () => {
          fetchClientActivities()
        })
        .subscribe()

      const notesSubscription = supabase
        .channel('notes_changes_client_timeline')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'meeting_notes'
        }, () => {
          fetchClientActivities()
        })
        .subscribe()

      return () => {
        tasksSubscription.unsubscribe()
        eventsSubscription.unsubscribe()
        interactionsSubscription.unsubscribe()
        notesSubscription.unsubscribe()
      }
    }
  }, [selectedClientId, activityFilter, dateRange])

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, company_name, email, phone, created_at')
        .order('company_name')

      if (error) throw error
      setClients(data || [])
      
      if (!selectedClientId && data && data.length > 0) {
        setSelectedClientId(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchClientData = async () => {
    if (!selectedClientId) return

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', selectedClientId)
        .single()

      if (error) throw error
      setClient(data)
    } catch (error) {
      console.error('Error fetching client data:', error)
    }
  }

  const fetchClientActivities = async () => {
    if (!selectedClientId) return

    try {
      setLoading(true)
      const activities: ClientActivity[] = []
      
      // Calculate date range
      const now = new Date()
      let startDate: Date | null = null
      
      switch (dateRange) {
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
          break
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
          break
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
          break
        default:
          startDate = null
      }

      // Fetch tasks if needed
      if (activityFilter === 'all' || activityFilter === 'task') {
        let query = supabase
          .from('tasks')
          .select(`
            *,
            assignee:users!tasks_assigned_to_fkey(id, name, email)
          `)
          .eq('client_id', selectedClientId)
          .order('created_at', { ascending: false })

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString())
        }

        const { data: tasks, error: tasksError } = await query
        if (tasksError) throw tasksError
        
        tasks?.forEach(task => {
          activities.push({
            ...task,
            type: 'task',
            date: task.due_date || task.created_at
          })
        })
      }

      // Fetch events if needed
      if (activityFilter === 'all' || activityFilter === 'event') {
        let query = supabase
          .from('calendar_events')
          .select('*')
          .eq('client_id', selectedClientId)
          .order('start_time', { ascending: false })

        if (startDate) {
          query = query.gte('start_time', startDate.toISOString())
        }

        const { data: events, error: eventsError } = await query
        if (eventsError) throw eventsError
        
        events?.forEach(event => {
          activities.push({
            ...event,
            type: 'event',
            date: event.start_time
          })
        })
      }

      // Fetch interactions if needed
      if (activityFilter === 'all' || activityFilter === 'interaction') {
        let query = supabase
          .from('interactions')
          .select('*')
          .eq('client_id', selectedClientId)
          .order('interaction_date', { ascending: false })

        if (startDate) {
          query = query.gte('interaction_date', startDate.toISOString())
        }

        const { data: interactions, error: interactionsError } = await query
        if (interactionsError) throw interactionsError
        
        interactions?.forEach(interaction => {
          activities.push({
            ...interaction,
            type: 'interaction',
            date: interaction.interaction_date
          })
        })
      }

      // Fetch meeting notes if needed
      if (activityFilter === 'all' || activityFilter === 'note') {
        let query = supabase
          .from('meeting_notes')
          .select('*')
          .eq('client_id', selectedClientId)
          .order('meeting_date', { ascending: false })

        if (startDate) {
          query = query.gte('meeting_date', startDate.toISOString())
        }

        const { data: notes, error: notesError } = await query
        if (notesError) throw notesError
        
        notes?.forEach(note => {
          activities.push({
            ...note,
            type: 'note',
            title: note.subject || 'Meeting Note',
            description: note.notes,
            date: note.meeting_date
          })
        })
      }

      // Sort activities by date
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      setActivities(activities)
    } catch (error) {
      console.error('Error fetching client activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = activities.filter(activity => {
    if (searchTerm && !activity.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    return true
  })

  const getActivityIcon = (activity: ClientActivity) => {
    switch (activity.type) {
      case 'task':
        return activity.status === 'completed' ? 
          <CheckCircle className="w-5 h-5 text-green-600" /> :
          activity.status === 'in_progress' ?
          <AlertCircle className="w-5 h-5 text-yellow-600" /> :
          <Circle className="w-5 h-5 text-gray-400" />
      case 'event':
        return <Calendar className="w-5 h-5 text-primary-600" />
      case 'interaction':
        return activity.interaction_type === 'call' ?
          <Phone className="w-5 h-5 text-green-600" /> :
          activity.interaction_type === 'email' ?
          <Mail className="w-5 h-5 text-primary-600" /> :
          <MessageSquare className="w-5 h-5 text-purple-600" />
      case 'note':
        return <FileText className="w-5 h-5 text-orange-600" />
      default:
        return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const getActivityColor = (activity: ClientActivity) => {
    switch (activity.type) {
      case 'task': return 'border-l-blue-500'
      case 'event': return 'border-l-green-500'
      case 'interaction': return 'border-l-purple-500'
      case 'note': return 'border-l-orange-500'
      default: return 'border-l-gray-300'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return formatDate(dateString)
  }

  if (loading && selectedClientId) {
    return (
      <div className="section-container">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
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
            <User className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-primary">Client Timeline</h2>
          </div>
        </div>

        {/* Client Selector */}
        <div className="mb-4">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="input-standard"
          >
            <option value="">Select a client...</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {client.company_name}
              </option>
            ))}
          </select>
        </div>

        {/* Client Info */}
        {client && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-primary">{client.company_name}</h3>
              </div>
              <div className="text-right text-sm text-muted">
                {client.email && (
                  <div className="flex items-center space-x-1">
                    <Mail className="w-4 h-4" />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Phone className="w-4 h-4" />
                    <span>{client.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {selectedClientId && (
          <div className="grid-responsive gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-standard pl-10"
              />
            </div>

            {/* Activity Filter */}
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as any)}
              className="input-standard"
            >
              <option value="all">All Activities</option>
              <option value="task">Tasks</option>
              <option value="event">Events</option>
              <option value="interaction">Interactions</option>
              <option value="note">Notes</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="input-standard"
            >
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
              <option value="quarter">Past Quarter</option>
              <option value="all">All Time</option>
            </select>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="p-6">
        {!selectedClientId ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">Select a client</h3>
            <p className="text-muted">
              Choose a client from the dropdown above to view their timeline
            </p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-primary mb-2">No activities found</h3>
            <p className="text-muted">
              {searchTerm ? 'Try adjusting your search terms' : 'No activities for this client in the selected time range'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredActivities.map((activity, index) => (
              <div key={activity.id} className="relative">
                {/* Timeline connector */}
                {index < filteredActivities.length - 1 && (
                  <div className="absolute left-5 top-12 w-px h-6 bg-gray-200"></div>
                )}

                <div className="flex space-x-4">
                  {/* Activity Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                    {getActivityIcon(activity)}
                  </div>

                  {/* Activity Content */}
                  <div className={`flex-1 section-container border-l-4 ${getActivityColor(activity)} hover:shadow-md transition-shadow p-4`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-medium text-primary">{activity.title}</h4>
                          <span className="text-xs text-muted capitalize">
                            {activity.type}
                          </span>
                          {activity.priority && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              activity.priority === 'high' ? 'bg-red-100 text-red-800' :
                              activity.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {activity.priority}
                            </span>
                          )}
                        </div>
                        
                        {activity.description && (
                          <p className="text-sm text-secondary mb-2">
                            {activity.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-muted">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>{formatDate(activity.date)} at {formatTime(activity.date)}</span>
                          </span>
                          
                          {activity.assignee && (
                            <span className="flex items-center space-x-1">
                              <User className="w-3 h-3" />
                              <span>Assigned to {activity.assignee.name}</span>
                            </span>
                          )}
                          
                          {activity.interaction_type && (
                            <span className="capitalize">
                              {activity.interaction_type}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted">
                        {getRelativeTime(activity.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientTimeline