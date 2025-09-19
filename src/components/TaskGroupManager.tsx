import React, { useState, useEffect } from 'react'
import { Plus, Users, Search, Filter, Edit2, Trash2, CheckCircle, Circle, AlertCircle, Calendar, User, X, Save, FolderPlus, Folder } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date?: string
  client_id?: string
  assigned_to?: string
  created_at: string
  client?: {
    id: string
    company_name: string
  }
  assignee?: {
    id: string
    name: string
    email: string
  }
}

interface TaskGroup {
  id: string
  name: string
  description?: string
  color: string
  created_by: string
  created_at: string
  updated_at: string
  creator?: {
    id: string
    name: string
    email: string
  }
  task_count?: number
  completed_tasks?: number
}

interface TaskGroupMember {
  id: string
  task_group_id: string
  task_id: string
  added_at: string
  task?: Task
}

interface TaskGroupManagerProps {
  currentUserId: string
}

const TaskGroupManager: React.FC<TaskGroupManagerProps> = ({ currentUserId }) => {
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedGroup, setSelectedGroup] = useState<TaskGroup | null>(null)
  const [groupTasks, setGroupTasks] = useState<Task[]>([])
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all')
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  })

  const colors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Yellow', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Indigo', value: '#6366F1' },
    { name: 'Gray', value: '#6B7280' }
  ]

  useEffect(() => {
    fetchTaskGroups()
    fetchTasks()
    
    // Set up real-time subscriptions
    const taskGroupsSubscription = supabase
      .channel('task_groups_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'task_groups'
      }, () => {
        fetchTaskGroups()
      })
      .subscribe()

    const taskGroupMembersSubscription = supabase
      .channel('task_group_members_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'task_group_members'
      }, () => {
        fetchTaskGroups()
        if (selectedGroup) {
          fetchGroupTasks(selectedGroup.id)
        }
      })
      .subscribe()

    const tasksSubscription = supabase
      .channel('tasks_changes_taskgroup')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tasks'
      }, () => {
        fetchTasks()
        if (selectedGroup) {
          fetchGroupTasks(selectedGroup.id)
        }
      })
      .subscribe()

    return () => {
      taskGroupsSubscription.unsubscribe()
      taskGroupMembersSubscription.unsubscribe()
      tasksSubscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      fetchGroupTasks(selectedGroup.id)
    }
  }, [selectedGroup])

  const fetchTaskGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('task_groups')
        .select(`
          *,
          creator:created_by(id, name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get task counts for each group
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { data: members, error: membersError } = await supabase
            .from('task_group_members')
            .select(`
              task:tasks!task_group_members_task_id_fkey(id, status)
            `)
            .eq('task_group_id', group.id)

          if (membersError) throw membersError

          const taskCount = members?.length || 0
          const completedTasks = members?.filter(m => m.task && (m.task as any).status === 'completed').length || 0

          return {
            ...group,
            task_count: taskCount,
            completed_tasks: completedTasks
          }
        })
      )

      setTaskGroups(groupsWithCounts)
    } catch (error) {
      console.error('Error fetching task groups:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          client:clients!tasks_client_id_fkey(id, company_name),
          assignee:users!tasks_assigned_to_fkey(id, name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTasks(data || [])
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchGroupTasks = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .from('task_group_members')
        .select(`
          *,
          task:tasks!task_group_members_task_id_fkey(
            *,
            client:clients!tasks_client_id_fkey(id, company_name),
            assignee:users!tasks_assigned_to_fkey(id, name, email)
          )
        `)
        .eq('task_group_id', groupId)
        .order('added_at', { ascending: false })

      if (error) throw error

      const tasks = data?.map(member => member.task).filter(Boolean) || []
      setGroupTasks(tasks as Task[])

      // Update available tasks (exclude tasks already in this group)
      const groupTaskIds = tasks.map(task => task.id)
      const available = tasks.filter(task => !groupTaskIds.includes(task.id))
      setAvailableTasks(available)
    } catch (error) {
      console.error('Error fetching group tasks:', error)
    }
  }

  const createTaskGroup = async () => {
    try {
      const { data, error } = await supabase
        .from('task_groups')
        .insert({
          name: formData.name,
          description: formData.description,
          color: formData.color,
          created_by: currentUserId
        })
        .select()
        .single()

      if (error) throw error

      setShowCreateModal(false)
      setFormData({ name: '', description: '', color: '#3B82F6' })
      fetchTaskGroups()
    } catch (error) {
      console.error('Error creating task group:', error)
    }
  }

  const updateTaskGroup = async () => {
    if (!selectedGroup) return

    try {
      const { error } = await supabase
        .from('task_groups')
        .update({
          name: formData.name,
          description: formData.description,
          color: formData.color
        })
        .eq('id', selectedGroup.id)

      if (error) throw error

      setShowEditModal(false)
      setFormData({ name: '', description: '', color: '#3B82F6' })
      fetchTaskGroups()
      if (selectedGroup) {
        setSelectedGroup({ ...selectedGroup, name: formData.name, description: formData.description, color: formData.color })
      }
    } catch (error) {
      console.error('Error updating task group:', error)
    }
  }

  const deleteTaskGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this task group? This will not delete the tasks themselves.')) {
      return
    }

    try {
      // First delete all group members
      await supabase
        .from('task_group_members')
        .delete()
        .eq('task_group_id', groupId)

      // Then delete the group
      const { error } = await supabase
        .from('task_groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error

      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null)
        setGroupTasks([])
      }
      fetchTaskGroups()
    } catch (error) {
      console.error('Error deleting task group:', error)
    }
  }

  const addTasksToGroup = async () => {
    if (!selectedGroup || selectedTasks.length === 0) return

    try {
      const members = selectedTasks.map(taskId => ({
        task_group_id: selectedGroup.id,
        task_id: taskId
      }))

      const { error } = await supabase
        .from('task_group_members')
        .insert(members)

      if (error) throw error

      setShowAddTaskModal(false)
      setSelectedTasks([])
      fetchGroupTasks(selectedGroup.id)
      fetchTaskGroups()
    } catch (error) {
      console.error('Error adding tasks to group:', error)
    }
  }

  const removeTaskFromGroup = async (taskId: string) => {
    if (!selectedGroup) return

    try {
      const { error } = await supabase
        .from('task_group_members')
        .delete()
        .eq('task_group_id', selectedGroup.id)
        .eq('task_id', taskId)

      if (error) throw error

      fetchGroupTasks(selectedGroup.id)
      fetchTaskGroups()
    } catch (error) {
      console.error('Error removing task from group:', error)
    }
  }

  const openEditModal = (group: TaskGroup) => {
    setSelectedGroup(group)
    setFormData({
      name: group.name,
      description: group.description || '',
      color: group.color
    })
    setShowEditModal(true)
  }

  const getTaskIcon = (task: Task) => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />
      default:
        return <Circle className="w-4 h-4 text-gray-400" />
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

  const filteredTasks = groupTasks.filter(task => {
    if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }
    if (statusFilter !== 'all' && task.status !== statusFilter) {
      return false
    }
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
      return false
    }
    return true
  })

  const getAvailableTasksForGroup = () => {
    const groupTaskIds = groupTasks.map(task => task.id)
    return tasks.filter(task => !groupTaskIds.includes(task.id))
  }

  if (loading) {
    return (
      <div className="section-container p-6">
        <div className="loading-skeleton">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Folder className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-primary">Task Groups</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Task Groups List */}
        <div className="lg:w-1/3 border-r border-gray-200 card-body">
          <h3 className="font-medium text-primary mb-4">Groups ({taskGroups.length})</h3>
          
          {taskGroups.length === 0 ? (
            <div className="text-center py-8">
              <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-muted mb-4">No task groups yet</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-secondary"
              >
                Create your first group
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {taskGroups.map(group => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroup(group)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedGroup?.id === group.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: group.color }}
                        ></div>
                        <h4 className="font-medium text-primary">{group.name}</h4>
                      </div>
                      
                      {group.description && (
                        <p className="text-sm text-secondary mb-2">
                          {group.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted">
                        <span>{group.task_count || 0} tasks</span>
                        <span>
                          {group.completed_tasks || 0}/{group.task_count || 0} completed
                        </span>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            backgroundColor: group.color,
                            width: `${group.task_count ? ((group.completed_tasks || 0) / group.task_count) * 100 : 0}%`
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditModal(group)
                        }}
                        className="btn-secondary p-1"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteTaskGroup(group.id)
                        }}
                        className="btn-danger p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Group Tasks */}
        <div className="lg:w-2/3 card-body">
          {!selectedGroup ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-primary mb-2">Select a task group</h3>
              <p className="text-muted">
                Choose a group from the left to view and manage its tasks
              </p>
            </div>
          ) : (
            <div>
              {/* Group Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedGroup.color }}
                  ></div>
                  <h3 className="text-lg font-semibold text-primary">
                    {selectedGroup.name}
                  </h3>
                  <span className="text-sm text-muted">
                    ({groupTasks.length} tasks)
                  </span>
                </div>
                
                <button
                  onClick={() => setShowAddTaskModal(true)}
                  className="btn-primary flex items-center space-x-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Tasks</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-standard w-full pl-10 pr-4"
                  />
                </div>
                
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
                
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as any)}
                  className="select-standard"
                >
                  <option value="all">All Priority</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              {/* Tasks List */}
              {filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                  <Circle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-primary mb-2">
                    {groupTasks.length === 0 ? 'No tasks in this group' : 'No tasks match your filters'}
                  </h4>
                  <p className="text-muted mb-4">
                    {groupTasks.length === 0 
                      ? 'Add some tasks to get started'
                      : 'Try adjusting your search or filters'
                    }
                  </p>
                  {groupTasks.length === 0 && (
                    <button
                      onClick={() => setShowAddTaskModal(true)}
                      className="btn-secondary"
                    >
                      Add tasks to this group
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map(task => (
                    <div
                      key={task.id}
                      className="card-container p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getTaskIcon(task)}
                            <h4 className="font-medium text-primary">{task.title}</h4>
                            <span className={`badge ${getPriorityBadge(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-secondary mb-2">
                              {task.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-xs text-muted">
                            {task.client && (
                              <span className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{task.client.company_name}</span>
                              </span>
                            )}
                            
                            {task.assignee && (
                              <span className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>Assigned to {task.assignee.name}</span>
                              </span>
                            )}
                            
                            {task.due_date && (
                              <span className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>Due {new Date(task.due_date).toLocaleDateString()}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => removeTaskFromGroup(task.id)}
                          className="btn-danger p-1 ml-2"
                          title="Remove from group"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-container w-full max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-primary">Create Task Group</h3>
            </div>
            <div className="modal-body">
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-standard"
                  placeholder="Enter group name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-standard"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color.value ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ name: '', description: '', color: '#3B82F6' })
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={createTaskGroup}
                disabled={!formData.name.trim()}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>Create Group</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-container w-full max-w-md">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-primary">Edit Task Group</h3>
            </div>
            <div className="modal-body">
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-standard"
                  placeholder="Enter group name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-standard"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-secondary mb-2">
                  Color
                </label>
                <div className="flex flex-wrap gap-2">
                  {colors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color.value ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setFormData({ name: '', description: '', color: '#3B82F6' })
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={updateTaskGroup}
                disabled={!formData.name.trim()}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tasks Modal */}
      {showAddTaskModal && selectedGroup && (
        <div className="modal-overlay">
          <div className="modal-container w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="modal-header">
              <h3 className="text-lg font-semibold text-primary">
                Add Tasks to {selectedGroup.name}
              </h3>
            </div>
            <div className="modal-body">
            
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search available tasks..."
                  className="input-standard w-full pl-10 pr-4"
                />
              </div>
            </div>
            
            <div className="space-y-2 mb-6 max-h-96 overflow-y-auto">
              {getAvailableTasksForGroup().map(task => (
                <div
                  key={task.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTasks.includes(task.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedTasks(prev => 
                      prev.includes(task.id)
                        ? prev.filter(id => id !== task.id)
                        : [...prev, task.id]
                    )
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(task.id)}
                      onChange={() => {}}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        {getTaskIcon(task)}
                        <h4 className="font-medium text-primary">{task.title}</h4>
                        <span className={`badge ${getPriorityBadge(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted mt-1">
                        {task.client && (
                          <span>{task.client.company_name}</span>
                        )}
                        {task.assignee && (
                          <span>Assigned to {task.assignee.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {getAvailableTasksForGroup().length === 0 && (
                <div className="text-center py-8">
                  <Circle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted">No available tasks to add</p>
                </div>
              )}
            </div>
            
            </div>
            <div className="modal-footer">
              <span className="text-sm text-muted">
                {selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''} selected
              </span>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddTaskModal(false)
                    setSelectedTasks([])
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={addTasksToGroup}
                  disabled={selectedTasks.length === 0}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Selected Tasks</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskGroupManager