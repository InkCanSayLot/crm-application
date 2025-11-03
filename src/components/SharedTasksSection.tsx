import React, { useState, useEffect } from 'react'
import { Users, Plus, Filter, Search, Calendar, Clock, User, CheckCircle, Circle, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AddSharedTaskModal from './AddSharedTaskModal'

interface SharedTask {
  id: string
  task_id: string
  shared_with: string
  permission_level: string
  created_at: string
  task?: {
    id: string
    title: string
    description?: string
    priority: 'low' | 'medium' | 'high'
    status: 'pending' | 'in_progress' | 'completed'
    due_date?: string
    created_at: string
    updated_at: string
    assigned_to?: string
    client_id?: string
    assignee?: {
      id: string
      name: string
      email: string
    }
    client?: {
      id: string
      company_name: string
    }
  }
  shared_user?: {
    id: string
    name: string
    email: string
  }
}

interface SharedTasksSectionProps {
  currentUserId: string
}

const SharedTasksSection: React.FC<SharedTasksSectionProps> = ({ currentUserId }) => {
  const [sharedTasks, setSharedTasks] = useState<SharedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'assigned' | 'created'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchSharedTasks()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('shared_tasks_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shared_tasks'
      }, () => {
        fetchSharedTasks()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchSharedTasks = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
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
            created_at,
            updated_at,
            assigned_to,
            client_id,
            assignee:users!tasks_assigned_to_fkey(id, name, email),
            client:clients!tasks_client_id_fkey(id, company_name)
          ),
          shared_user:users!shared_tasks_shared_with_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      setSharedTasks(data || [])
    } catch (error) {
      console.error('Error fetching shared tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)

      if (error) throw error
      fetchSharedTasks()
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const filteredTasks = sharedTasks.filter(sharedTask => {
    if (!sharedTask.task) return false
    
    const task = sharedTask.task
    
    // Filter by assignment/creation
    if (filter === 'assigned' && task.assignee?.id !== currentUserId) return false
    if (filter === 'created' && sharedTask.shared_with !== currentUserId) return false
    
    // Filter by status
    if (statusFilter !== 'all' && task.status !== statusFilter) return false
    
    // Filter by search term
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
    
    return true
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'badge-error'
      case 'medium': return 'badge-warning'
      case 'low': return 'badge-success'
      default: return 'badge-info'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'in_progress': return <AlertCircle className="w-5 h-5 text-yellow-600" />
      default: return <Circle className="w-5 h-5 text-gray-400" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="section-container p-6">
        <div className="loading-skeleton">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="section-container">
        {/* Header */}
        <div className="card-header">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-primary">Shared Tasks</h2>
              <span className="badge badge-info">
                {filteredTasks.length}
              </span>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-standard"
              />
            </div>

            {/* Assignment Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="select-standard"
            >
              <option value="all">All Tasks</option>
              <option value="assigned">Assigned to Me</option>
              <option value="created">Created by Me</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="select-standard"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="card-body">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">No shared tasks found</h3>
              <p className="text-muted mb-4">
                {searchTerm || filter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create your first shared task to collaborate with your team'}
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn-primary"
              >
                Add Shared Task
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTasks.map(sharedTask => {
                const task = sharedTask.task
                if (!task) return null
                
                return (
                  <div
                    key={sharedTask.id}
                    className="card-container p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <button
                            onClick={() => {
                              const newStatus = task.status === 'completed' ? 'pending' : 
                                             task.status === 'pending' ? 'in_progress' : 'completed'
                              updateTaskStatus(task.id, newStatus)
                            }}
                            className="hover:scale-110 transition-transform"
                          >
                            {getStatusIcon(task.status)}
                          </button>
                          <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted' : 'text-primary'}`}>
                            {task.title}
                          </h3>
                          <span className={`badge ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="text-secondary text-sm mb-3">{task.description}</p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-muted">
                          {task.assignee && (
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>Assigned to {task.assignee.name}</span>
                            </div>
                          )}
                          
                          {task.due_date && (
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>Due {formatDate(task.due_date)}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>Created {formatDate(task.created_at)}</span>
                          </div>
                          
                          {sharedTask.shared_user && (
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>Shared with {sharedTask.shared_user.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <AddSharedTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTaskAdded={() => {
          fetchSharedTasks()
          setShowAddModal(false)
        }}
      />
    </>
  )
}

export default SharedTasksSection