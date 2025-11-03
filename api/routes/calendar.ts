/**
 * Calendar API routes for events and tasks management
 * Handle CRUD operations for calendar events and tasks
 */
import { Router, type Request, type Response } from 'express'
import { supabaseServiceClient as supabase } from '../config/supabase'

const router = Router()

// ============ CALENDAR EVENTS ============

/**
 * Get all calendar events (shared + user's personal events)
 * GET /api/calendar/events
 */
router.get('/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, type } = req.query
    const userId = req.headers['user-id'] as string

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      })
      return
    }

    let query = supabase
      .from('calendar_events')
      .select('*')
      .order('start_time', { ascending: true })

    // Data separation: Get shared events (is_collective=true) OR user's personal events
    if (type === 'shared') {
      query = query.eq('is_collective', true)
    } else if (type === 'personal') {
      query = query.eq('is_collective', false).eq('user_id', userId)
    } else {
      // Default: get both shared events and user's personal events
      query = query.or(`is_collective.eq.true,and(is_collective.eq.false,user_id.eq.${userId})`)
    }

    // Filter by date range if provided
    if (start_date) {
      query = query.gte('start_time', start_date)
    }
    if (end_date) {
      query = query.lte('start_time', end_date)
    }

    const { data: events, error } = await query

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: events
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    })
  }
})

/**
 * Get event by ID
 * GET /api/calendar/events/:id
 */
router.get('/events/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid event ID format'
      })
      return
    }

    const { data: event, error } = await supabase
      .from('calendar_events')
      .select(`
        *,
        client:clients(id, company_name, contact_name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      res.status(404).json({
        success: false,
        error: 'Event not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: event
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event'
    })
  }
})

/**
 * Create new calendar event
 * POST /api/calendar/events
 */
router.post('/events', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      start_time,
      end_time,
      type = 'meeting',
      client_id,
      location,
      meeting_url,
      is_collective = false
    } = req.body
    const userId = req.headers['user-id'] as string

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      })
      return
    }

    // Validate required fields
    if (!title || !start_time) {
      res.status(400).json({
        success: false,
        error: 'Title and start time are required'
      })
      return
    }

    const { data: event, error } = await supabase
      .from('calendar_events')
      .insert({
        title,
        description,
        start_time,
        end_time,
        type,
        client_id,
        location,
        meeting_url,
        is_collective,
        user_id: is_collective ? null : userId, // Personal events have user_id, shared events don't
        created_by: userId
      })
      .select('*')
      .single()

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(201).json({
      success: true,
      data: event
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create event'
    })
  }
})

/**
 * Update calendar event
 * PUT /api/calendar/events/:id
 */
router.put('/events/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      start_time,
      end_time,
      type,
      client_id
    } = req.body

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid event ID format'
      })
      return
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (start_time !== undefined) updateData.start_time = start_time
    if (end_time !== undefined) updateData.end_time = end_time
    if (type !== undefined) updateData.type = type
    if (client_id !== undefined) updateData.client_id = client_id

    const { data: event, error } = await supabase
      .from('calendar_events')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: event
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update event'
    })
  }
})

/**
 * Delete calendar event
 * DELETE /api/calendar/events/:id
 */
router.delete('/events/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid event ID format'
      })
      return
    }

    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', id)

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete event'
    })
  }
})

// ============ TASKS ============

/**
 * Get all tasks
 * GET /api/calendar/tasks
 */
router.get('/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, priority, client_id } = req.query

    let query = supabase
      .from('tasks')
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        assignee:users!tasks_assigned_to_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }
    if (priority) {
      query = query.eq('priority', priority)
    }
    if (client_id) {
      query = query.eq('client_id', client_id)
    }

    const { data: tasks, error } = await query

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: tasks
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks'
    })
  }
})

/**
 * Get task by ID
 * GET /api/calendar/tasks/:id
 */
router.get('/tasks/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid task ID format'
      })
      return
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        assignee:users!tasks_assigned_to_fkey(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      res.status(404).json({
        success: false,
        error: 'Task not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: task
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task'
    })
  }
})

/**
 * Create new task
 * POST /api/calendar/tasks
 */
router.post('/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      status = 'pending',
      priority = 'medium',
      due_date,
      client_id,
      assigned_to
    } = req.body

    // Validate required fields
    if (!title) {
      res.status(400).json({
        success: false,
        error: 'Title is required'
      })
      return
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        status,
        priority,
        due_date,
        client_id,
        assigned_to
      })
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        assignee:users!tasks_assigned_to_fkey(id, name, email)
      `)
      .single()

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(201).json({
      success: true,
      data: task
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create task'
    })
  }
})

/**
 * Update task
 * PUT /api/calendar/tasks/:id
 */
router.put('/tasks/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      status,
      priority,
      due_date,
      client_id,
      assigned_to
    } = req.body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status
    if (priority !== undefined) updateData.priority = priority
    if (due_date !== undefined) updateData.due_date = due_date
    if (client_id !== undefined) updateData.client_id = client_id
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        assignee:users!tasks_assigned_to_fkey(id, name, email)
      `)
      .single()

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: task
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update task'
    })
  }
})

/**
 * Delete task
 * DELETE /api/calendar/tasks/:id
 */
router.delete('/tasks/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete task'
    })
  }
})

/**
 * Get calendar statistics
 * GET /api/calendar/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get upcoming events count
    const { count: upcomingEvents, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*', { count: 'exact', head: true })
      .gte('start_time', new Date().toISOString())

    if (eventsError) {
      res.status(400).json({
        success: false,
        error: eventsError.message
      })
      return
    }

    // Get tasks by status
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('status, priority')

    if (taskError) {
      res.status(400).json({
        success: false,
        error: taskError.message
      })
      return
    }

    // Calculate task counts
    const taskStats = taskData?.reduce((acc: any, task: any) => {
      acc.byStatus[task.status] = (acc.byStatus[task.status] || 0) + 1
      acc.byPriority[task.priority] = (acc.byPriority[task.priority] || 0) + 1
      return acc
    }, { byStatus: {}, byPriority: {} }) || { byStatus: {}, byPriority: {} }

    const totalTasks = taskData?.length || 0
    const completedTasks = taskStats.byStatus.completed || 0
    const completionRate = totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : '0.0'

    res.status(200).json({
      success: true,
      data: {
        upcomingEvents: upcomingEvents || 0,
        completedTasks,
        totalTasks,
        tasksByStatus: taskStats.byStatus,
        tasksByPriority: taskStats.byPriority,
        completionRate
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    })
  }
})

// ============ TASK GROUPS ============

/**
 * Get all task groups
 * GET /api/calendar/task-groups
 */
router.get('/task-groups', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: taskGroups, error } = await supabase
      .from('task_groups')
      .select(`
        *,
        created_by:users(id, name, email),
        tasks:task_group_members(
          order_index,
          task:tasks(
            id,
            title,
            description,
            status,
            priority,
            due_date,
            completed
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: taskGroups
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task groups'
    })
  }
})

/**
 * Create new task group
 * POST /api/calendar/task-groups
 */
router.post('/task-groups', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      task_ids = []
    } = req.body

    // Validate required fields
    if (!name) {
      res.status(400).json({
        success: false,
        error: 'Name is required'
      })
      return
    }

    // Create task group
    const { data: taskGroup, error: groupError } = await supabase
      .from('task_groups')
      .insert({
        name,
        description,
        created_by: req.body.created_by // This should come from auth middleware
      })
      .select('*')
      .single()

    if (groupError) {
      res.status(400).json({
        success: false,
        error: groupError.message
      })
      return
    }

    // Add tasks to group if provided
    if (task_ids.length > 0) {
      const taskGroupMembers = task_ids.map((taskId: string, index: number) => ({
        task_group_id: taskGroup.id,
        task_id: taskId,
        order_index: index
      }))

      const { error: membersError } = await supabase
        .from('task_group_members')
        .insert(taskGroupMembers)

      if (membersError) {
        res.status(400).json({
          success: false,
          error: membersError.message
        })
        return
      }
    }

    res.status(201).json({
      success: true,
      data: taskGroup
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create task group'
    })
  }
})

/**
 * Update task group
 * PUT /api/calendar/task-groups/:id
 */
router.put('/task-groups/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { name, description } = req.body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description

    const { data: taskGroup, error } = await supabase
      .from('task_groups')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: taskGroup
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update task group'
    })
  }
})

/**
 * Delete task group
 * DELETE /api/calendar/task-groups/:id
 */
router.delete('/task-groups/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('task_groups')
      .delete()
      .eq('id', id)

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Task group deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete task group'
    })
  }
})

/**
 * Add task to group
 * POST /api/calendar/task-groups/:id/tasks
 */
router.post('/task-groups/:id/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { task_id, order_index = 0 } = req.body

    if (!task_id) {
      res.status(400).json({
        success: false,
        error: 'Task ID is required'
      })
      return
    }

    const { data: member, error } = await supabase
      .from('task_group_members')
      .insert({
        task_group_id: id,
        task_id,
        order_index
      })
      .select('*')
      .single()

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(201).json({
      success: true,
      data: member
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add task to group'
    })
  }
})

/**
 * Remove task from group
 * DELETE /api/calendar/task-groups/:id/tasks/:taskId
 */
router.delete('/task-groups/:id/tasks/:taskId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, taskId } = req.params

    const { error } = await supabase
      .from('task_group_members')
      .delete()
      .eq('task_group_id', id)
      .eq('task_id', taskId)

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Task removed from group successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove task from group'
    })
  }
})

// ============ SHARED TASKS ============

/**
 * Get shared tasks for current user
 * GET /api/calendar/shared-tasks
 */
router.get('/shared-tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const { user_id } = req.query

    if (!user_id) {
      res.status(400).json({
        success: false,
        error: 'User ID is required'
      })
      return
    }

    const { data: sharedTasks, error } = await supabase
      .from('shared_tasks')
      .select(`
        *,
        task:tasks(
          *,
          client:clients(id, company_name, contact_name),
          assignee:users!tasks_assigned_to_fkey(id, name, email)
        )
      `)
      .eq('shared_with', user_id)
      .order('created_at', { ascending: false })

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: sharedTasks
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shared tasks'
    })
  }
})

/**
 * Share task with team members
 * POST /api/calendar/tasks/:id/share
 */
router.post('/tasks/:id/share', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { user_ids, permission_level = 'view' } = req.body

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      res.status(400).json({
        success: false,
        error: 'User IDs array is required'
      })
      return
    }

    // Update task to mark as shared
    const { error: taskError } = await supabase
      .from('tasks')
      .update({ is_shared: true })
      .eq('id', id)

    if (taskError) {
      res.status(400).json({
        success: false,
        error: taskError.message
      })
      return
    }

    // Create shared task records
    const sharedTaskRecords = user_ids.map((userId: string) => ({
      task_id: id,
      shared_with: userId,
      permission_level
    }))

    const { data: sharedTasks, error } = await supabase
      .from('shared_tasks')
      .insert(sharedTaskRecords)
      .select('*')

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(201).json({
      success: true,
      data: sharedTasks
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to share task'
    })
  }
})

/**
 * Remove task sharing
 * DELETE /api/calendar/tasks/:id/share/:userId
 */
router.delete('/tasks/:id/share/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, userId } = req.params

    const { error } = await supabase
      .from('shared_tasks')
      .delete()
      .eq('task_id', id)
      .eq('shared_with', userId)

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      message: 'Task sharing removed successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove task sharing'
    })
  }
})

/**
 * Create a new shared task
 * POST /api/calendar/shared-tasks
 */
router.post('/shared-tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, due_date, priority, shared_with } = req.body

    if (!title) {
      res.status(400).json({
        success: false,
        error: 'Title is required'
      })
      return
    }

    // Create the task first
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title,
        description,
        due_date,
        priority: priority || 'medium',
        status: 'pending',
        completed: false,
        is_shared: true
      })
      .select()
      .single()

    if (taskError) {
      res.status(400).json({
        success: false,
        error: taskError.message
      })
      return
    }

    // Create shared_task records for each user
    if (shared_with && shared_with.length > 0) {
      const sharedTaskRecords = shared_with.map((userId: string) => ({
        task_id: task.id,
        shared_with: userId
      }))

      const { error: sharedError } = await supabase
        .from('shared_tasks')
        .insert(sharedTaskRecords)

      if (sharedError) {
        // If sharing fails, we should still return the task but log the error
        console.error('Failed to create shared task records:', sharedError)
      }
    }

    res.status(201).json({
      success: true,
      data: task,
      message: 'Shared task created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create shared task'
    })
  }
})

// ============ TIMELINE ============

/**
 * Get client timeline
 * GET /api/calendar/timeline/client/:clientId
 */
router.get('/timeline/client/:clientId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientId } = req.params
    const { start_date, end_date } = req.query

    // Get tasks for client
    let tasksQuery = supabase
      .from('tasks')
      .select(`
        id,
        title,
        description,
        status,
        priority,
        due_date,
        completed,
        created_at,
        assignee:users!tasks_assigned_to_fkey(id, name, email)
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })

    if (start_date) tasksQuery = tasksQuery.gte('created_at', start_date)
    if (end_date) tasksQuery = tasksQuery.lte('created_at', end_date)

    const { data: tasks, error: tasksError } = await tasksQuery

    if (tasksError) {
      res.status(400).json({
        success: false,
        error: tasksError.message
      })
      return
    }

    // Get events for client
    let eventsQuery = supabase
      .from('calendar_events')
      .select('*')
      .eq('client_id', clientId)
      .order('start_time', { ascending: true })

    if (start_date) eventsQuery = eventsQuery.gte('start_time', start_date)
    if (end_date) eventsQuery = eventsQuery.lte('start_time', end_date)

    const { data: events, error: eventsError } = await eventsQuery

    if (eventsError) {
      res.status(400).json({
        success: false,
        error: eventsError.message
      })
      return
    }

    // Get interactions for client
    let interactionsQuery = supabase
      .from('interactions')
      .select('*')
      .eq('client_id', clientId)
      .order('interaction_date', { ascending: true })

    if (start_date) interactionsQuery = interactionsQuery.gte('interaction_date', start_date)
    if (end_date) interactionsQuery = interactionsQuery.lte('interaction_date', end_date)

    const { data: interactions, error: interactionsError } = await interactionsQuery

    if (interactionsError) {
      res.status(400).json({
        success: false,
        error: interactionsError.message
      })
      return
    }

    // Combine and format timeline data
    const timelineEvents = [
      ...tasks.map(task => ({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description,
        date: task.due_date || task.created_at,
        status: task.completed ? 'completed' : task.status,
        priority: task.priority,
        assigned_to: task.assignee?.[0]?.id || null
      })),
      ...events.map(event => ({
        id: event.id,
        type: 'event',
        title: event.title,
        description: event.description,
        date: event.start_time,
        status: 'scheduled',
        event_type: event.type
      })),
      ...interactions.map(interaction => ({
        id: interaction.id,
        type: 'interaction',
        title: `${interaction.type} - ${interaction.subject}`,
        description: interaction.notes,
        date: interaction.interaction_date,
        status: interaction.status,
        interaction_type: interaction.type
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    res.status(200).json({
      success: true,
      data: timelineEvents
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client timeline'
    })
  }
})

/**
 * Get task-based timeline
 * GET /api/calendar/timeline/tasks
 */
router.get('/timeline/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const { task_group_id, start_date, end_date } = req.query

    let query = supabase
      .from('tasks')
      .select(`
        *,
        client:clients(id, company_name, contact_name),
        assignee:users!tasks_assigned_to_fkey(id, name, email),
        task_group:task_groups(id, name)
      `)
      .order('created_at', { ascending: true })

    if (task_group_id) query = query.eq('task_group_id', task_group_id)
    if (start_date) query = query.gte('created_at', start_date)
    if (end_date) query = query.lte('created_at', end_date)

    const { data: tasks, error } = await query

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    const timelineData = tasks.map(task => ({
      id: task.id,
      type: 'task',
      title: task.title,
      description: task.description,
      date: task.due_date || task.created_at,
      status: task.completed ? 'completed' : task.status,
      priority: task.priority,
      client: task.client,
      assigned_to: task.assigned_to,
      task_group: task.task_group
    }))

    res.status(200).json({
      success: true,
      data: timelineData
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task timeline'
    })
  }
})

/**
 * Get team activity timeline
 * GET /api/calendar/timeline/team
 */
router.get('/timeline/team', async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date } = req.query

    // Get recent tasks
    let tasksQuery = supabase
      .from('tasks')
      .select(`
        id,
        title,
        status,
        priority,
        created_at,
        updated_at,
        assignee:users!tasks_assigned_to_fkey(id, name, email),
        client:clients(id, company_name)
      `)
      .order('updated_at', { ascending: false })
      .limit(50)

    if (start_date) tasksQuery = tasksQuery.gte('updated_at', start_date)
    if (end_date) tasksQuery = tasksQuery.lte('updated_at', end_date)

    const { data: tasks, error: tasksError } = await tasksQuery

    if (tasksError) {
      res.status(400).json({
        success: false,
        error: tasksError.message
      })
      return
    }

    // Get recent events
    let eventsQuery = supabase
      .from('calendar_events')
      .select(`
        id,
        title,
        type,
        start_time,
        created_at,
        created_by:users(id, name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (start_date) eventsQuery = eventsQuery.gte('created_at', start_date)
    if (end_date) eventsQuery = eventsQuery.lte('created_at', end_date)

    const { data: events, error: eventsError } = await eventsQuery

    if (eventsError) {
      res.status(400).json({
        success: false,
        error: eventsError.message
      })
      return
    }

    // Combine and format team activity data
    const teamActivity = [
      ...tasks.map(task => ({
        id: task.id,
        type: 'task_update',
        title: `Task updated: ${task.title}`,
        date: task.updated_at,
        user: task.assignee?.[0]?.id || null,
        client: task.client,
        status: task.status,
        priority: task.priority
      })),
      ...events.map(event => ({
        id: event.id,
        type: 'event_created',
        title: `Event created: ${event.title}`,
        date: event.created_at,
        user: event.created_by,
        event_type: event.type,
        start_time: event.start_time
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    res.status(200).json({
      success: true,
      data: teamActivity
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch team timeline'
    })
  }
})

// Test endpoint to verify route registration
router.get('/test-route', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Route registration working' })
})

export default router