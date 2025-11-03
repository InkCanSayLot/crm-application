/**
 * CRM API routes for client management
 * Handle CRUD operations for clients
 */
import { Router, type Request, type Response } from 'express'
import { supabaseServiceClient as supabase } from '../config/supabase'

const router = Router()

/**
 * Get all users
 * GET /api/crm/users
 */
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  console.log('=== GET /users REQUEST ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Headers:', req.headers)
  console.log('Query:', req.query)
  console.log('IP:', req.ip)
  console.log('Timestamp:', new Date().toISOString())
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, full_name, phone, location, company, role, bio, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error fetching users:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: users || []
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    })
  }
})

/**
 * Get all clients
 * GET /api/crm/clients
 */
router.get('/clients', async (req: Request, res: Response): Promise<void> => {
  try {
    const { data: clients, error } = await supabase
      .from('clients')
      .select(`
        *,
        users!clients_assigned_to_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error fetching clients:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: clients || []
    })
  } catch (error) {
    console.error('Error fetching clients:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clients'
    })
  }
})

/**
 * Get user by ID
 * GET /api/crm/users/:id
 */
router.get('/users/:id', async (req: Request, res: Response): Promise<void> => {
  console.log('=== GET /users/:id REQUEST ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Params:', req.params);
  console.log('User ID:', req.params.id);
  console.log('User ID type:', typeof req.params.id);
  console.log('Headers:', req.headers);
  console.log('IP:', req.ip);
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const { id } = req.params;
    
    // Validate UUID format (more permissive for development/test UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('Invalid UUID format:', id);
      res.status(400).json({ 
        success: false,
        error: 'Invalid user ID format' 
      });
      return;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Database error fetching user:', error);
      res.status(400).json({ 
        success: false,
        error: error.message 
      });
      return;
    }

    if (!data) {
      res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: data
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error' 
    });
  }
})

/**
 * Update user profile
 * PUT /api/crm/users/:id
 */
router.put('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    console.log('PUT /users/:id - Received user ID:', id, 'Type:', typeof id)
    console.log('Request method:', req.method)
    console.log('Request URL:', req.url)
    console.log('Request IP:', req.ip || req.connection.remoteAddress)
    console.log('User-Agent:', req.get('User-Agent'))
    console.log('Referer:', req.get('Referer'))
    console.log('Origin:', req.get('Origin'))
    console.log('Request body:', JSON.stringify(req.body, null, 2))
    console.log('Full request headers:', JSON.stringify(req.headers, null, 2))
    console.log('Request timestamp:', new Date().toISOString())
    
    // Validate UUID format (more permissive for development/test UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      console.log('PUT /users/:id - Invalid UUID format:', id)
      res.status(400).json({
        success: false,
        error: 'Invalid user ID format. Expected UUID.'
      })
      return
    }
    const {
      name,
      full_name,
      email,
      phone,
      location,
      company,
      role,
      bio
    } = req.body

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (name !== undefined) updateData.name = name
    if (full_name !== undefined) updateData.full_name = full_name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (location !== undefined) updateData.location = location
    if (company !== undefined) updateData.company = company
    if (role !== undefined) updateData.role = role
    if (bio !== undefined) updateData.bio = bio

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('id, email, name, full_name, phone, location, company, role, bio, created_at, updated_at')
      .single()

    if (error) {
      console.error('Database error updating user:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update user'
    })
  }
})

/**
 * Get client by ID
 * GET /api/crm/clients/:id
 */
router.get('/clients/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { data: client, error } = await supabase
      .from('clients')
      .select(`
        *,
        assignee:users!clients_assigned_to_fkey(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      res.status(404).json({
        success: false,
        error: 'Client not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: client
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch client'
    })
  }
})

/**
 * Create new client
 * POST /api/crm/clients
 */
router.post('/clients', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      company_name,
      contact_name,
      email,
      phone,
      linkedin_url,
      stage = 'prospect',
      deal_value,
      assigned_to,
      last_contact_note,
      user_id
    } = req.body

    // Validate required fields
    if (!company_name) {
      res.status(400).json({
        success: false,
        error: 'Company name is required'
      })
      return
    }

    // Validate UUID format for assigned_to if provided
    let validatedAssignedTo = null
    if (assigned_to && assigned_to !== '') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(assigned_to)) {
        res.status(400).json({
          success: false,
          error: 'Invalid assigned_to user ID format. Expected UUID.'
        })
        return
      }
      validatedAssignedTo = assigned_to
    }

    // Validate UUID format for user_id if provided
    let validatedUserId = null
    if (user_id && user_id !== '') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(user_id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user_id format. Expected UUID.'
        })
        return
      }
      validatedUserId = user_id
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        company_name,
        contact_name,
        email,
        phone,
        linkedin_url,
        stage,
        deal_value: deal_value ? parseFloat(deal_value) : null,
        assigned_to: validatedAssignedTo,
        last_contact_note,
        user_id: validatedUserId
      })
      .select(`
        *,
        assignee:users!clients_assigned_to_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Database error creating client:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(201).json({
      success: true,
      data: client
    })
  } catch (error) {
    console.error('Error creating client:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create client'
    })
  }
})

/**
 * Update client
 * PUT /api/crm/clients/:id
 */
router.put('/clients/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      company_name,
      contact_name,
      email,
      phone,
      linkedin_url,
      stage,
      deal_value,
      assigned_to,
      last_contact_note,
      user_id
    } = req.body

    // Validate UUID format for assigned_to if provided
    if (assigned_to !== undefined && assigned_to !== null && assigned_to !== '') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(assigned_to)) {
        res.status(400).json({
          success: false,
          error: 'Invalid assigned_to user ID format. Expected UUID.'
        })
        return
      }
    }

    // Validate UUID format for user_id if provided
    if (user_id !== undefined && user_id !== null && user_id !== '') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(user_id)) {
        res.status(400).json({
          success: false,
          error: 'Invalid user_id format. Expected UUID.'
        })
        return
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (company_name !== undefined) updateData.company_name = company_name
    if (contact_name !== undefined) updateData.contact_name = contact_name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (linkedin_url !== undefined) updateData.linkedin_url = linkedin_url
    if (stage !== undefined) updateData.stage = stage
    if (deal_value !== undefined) updateData.deal_value = deal_value ? parseFloat(deal_value) : null
    if (assigned_to !== undefined) updateData.assigned_to = assigned_to === '' ? null : assigned_to
    if (last_contact_note !== undefined) updateData.last_contact_note = last_contact_note
    if (user_id !== undefined) updateData.user_id = user_id === '' ? null : user_id

    const { data: client, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        assignee:users!clients_assigned_to_fkey(id, name, email)
      `)
      .single()

    if (error) {
      console.error('Database error updating client:', error)
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: client
    })
  } catch (error) {
    console.error('Error updating client:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to update client'
    })
  }
})

/**
 * Delete client
 * DELETE /api/crm/clients/:id
 */
router.delete('/clients/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('clients')
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
      message: 'Client deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete client'
    })
  }
})

/**
 * Get client statistics
 * GET /api/crm/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get total clients count
    const { count: totalClients, error: countError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      res.status(400).json({
        success: false,
        error: countError.message
      })
      return
    }

    // Get clients by stage
    const { data: stageData, error: stageError } = await supabase
      .from('clients')
      .select('stage')

    if (stageError) {
      res.status(400).json({
        success: false,
        error: stageError.message
      })
      return
    }

    // Calculate stage counts
    const stageCounts = stageData?.reduce((acc: any, client: any) => {
      acc[client.stage] = (acc[client.stage] || 0) + 1
      return acc
    }, {}) || {}

    // Get total deal value
    const { data: dealData, error: dealError } = await supabase
      .from('clients')
      .select('deal_value')
      .not('deal_value', 'is', null)

    if (dealError) {
      res.status(400).json({
        success: false,
        error: dealError.message
      })
      return
    }

    const totalDealValue = dealData?.reduce((sum: number, client: any) => {
      return sum + (parseFloat(client.deal_value) || 0)
    }, 0) || 0

    // Calculate active deals (prospects + negotiation + proposal stages)
    const activeDeals = (stageCounts.prospect || 0) + (stageCounts.negotiation || 0) + (stageCounts.proposal || 0)
    
    res.status(200).json({
      success: true,
      data: {
        totalClients: totalClients || 0,
        activeDeals,
        stageCounts,
        totalRevenue: totalDealValue,
        conversionRate: parseFloat(totalClients ? ((stageCounts.closed || 0) / totalClients * 100).toFixed(1) : '0.0')
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    })
  }
})

export default router