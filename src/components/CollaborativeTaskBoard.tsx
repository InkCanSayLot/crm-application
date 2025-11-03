import React, { useState, useEffect } from 'react'
import { Users, Plus, MoreVertical, User, Calendar, AlertCircle, CheckCircle, Circle, Clock } from 'lucide-react'
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
  user?: {
    id: string
    name: string
    email: string
  }
}

interface CollaborativeTaskBoardProps {
  currentUserId: string
}

const CollaborativeTaskBoard: React.FC<CollaborativeTaskBoardProps> = ({ currentUserId }) => {
  const [tasks, setTasks] = useState<SharedTask[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const columns = [
    { id: 'pending', title: 'To Do', status: 'pending', color: 'bg-gray-50 border-gray-200' },
    { id: 'in_progress', title: 'In Progress', status: 'in_progress', color: 'bg-yellow-50 border-yellow-200' },
    { id: 'completed', title: 'Completed', status: 'completed', color: 'bg-green-50 border-green-200' }
  ]

  useEffect(() => {
    fetchTasks()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('collaborative_tasks_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'shared_tasks'
      }, () => {
        fetchTasks()
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchTasks = async () => {
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
            assignee:users!tasks_assigned_to_fkey(id, name, email),
            client:clients!tasks_client_id_fkey(id, company_name)
          ),
          user:users!shared_tasks_shared_with_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
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
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    
    if (draggedTask) {
      await updateTaskStatus(draggedTask, newStatus)
      setDraggedTask(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500'
      case 'medium': return 'border-l-yellow-500'
      case 'low': return 'border-l-green-500'
      default: return 'border-l-light'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'badge-error'
      case 'medium': return 'badge-warning'
      case 'low': return 'badge-success'
      default: return 'badge-info'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const isOverdue = (dueDateString: string) => {
    return new Date(dueDateString) < new Date()
  }

  const getTasksByStatus = (status: string) => {
    return tasks.filter(sharedTask => sharedTask.task?.status === status)
  }

  if (loading) {
    return (
      <div className="section-container p-6">
        <div className="loading-skeleton">
          <div className="h-6 bg-surface rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                {[1, 2].map(j => (
                  <div key={j} className="h-24 bg-surface rounded"></div>
                ))}
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
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-primary">Task Board</h2>
            <span className="badge badge-info">
              {tasks.length} tasks
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
      </div>

      {/* Kanban Board */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map(column => {
            const columnTasks = getTasksByStatus(column.status)
            
            return (
              <div
                key={column.id}
                className={`rounded-lg border-2 border-dashed ${column.color} min-h-96`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-primary">{column.title}</h3>
                    <span className="badge badge-secondary">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="p-4 space-y-3">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">
                        {column.status === 'pending' && <Circle className="w-8 h-8 mx-auto" />}
                        {column.status === 'in_progress' && <AlertCircle className="w-8 h-8 mx-auto" />}
                        {column.status === 'completed' && <CheckCircle className="w-8 h-8 mx-auto" />}
                      </div>
                      <p className="text-sm text-muted">
                        No {column.title.toLowerCase()} tasks
                      </p>
                    </div>
                  ) : (
                    columnTasks.map(sharedTask => {
                      const task = sharedTask.task
                      if (!task) return null
                      
                      return (
                        <div
                          key={sharedTask.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          className={`card-container border-l-4 ${getPriorityColor(task.priority)} hover:shadow-md transition-shadow cursor-move p-4 ${draggedTask === task.id ? 'opacity-50' : ''}`}
                        >
                          {/* Task Header */}
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-primary text-sm leading-tight">
                              {task.title}
                            </h4>
                            <button className="btn-secondary p-1">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Task Description */}
                          {task.description && (
                            <p className="text-secondary text-xs mb-3 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          {/* Task Meta */}
                          <div className="space-y-2">
                            {/* Priority Badge */}
                            <div className="flex items-center justify-between">
                              <span className={`badge ${getPriorityBadge(task.priority)}`}>
                                {task.priority}
                              </span>
                              
                              {/* Due Date */}
                              {task.due_date && (
                                <div className={`flex items-center space-x-1 text-xs ${
                                  isOverdue(task.due_date) && task.status !== 'completed'
                                    ? 'text-red-600'
                                    : 'text-muted'
                                }`}>
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(task.due_date)}</span>
                                </div>
                              )}
                            </div>

                            {/* Assignee */}
                            {task.assignee && (
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-primary-100 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-primary-600" />
                                </div>
                                <span className="text-xs text-secondary truncate">
                                  {task.assignee.name}
                                </span>
                              </div>
                            )}

                            {/* Created Time */}
                            <div className="flex items-center space-x-1 text-xs text-muted">
                              <Clock className="w-3 h-3" />
                              <span>Created {formatDate(task.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <AddSharedTaskModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onTaskAdded={() => {
          fetchTasks()
          setShowAddModal(false)
        }}
      />
    </div>
  )
}

export default CollaborativeTaskBoard