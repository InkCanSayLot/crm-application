/**
 * Journal API routes for journal entries management
 * Handle CRUD operations for journal entries
 */
import { Router, type Request, type Response } from 'express'
import { supabaseServiceClient as supabase } from '../config/supabase'

const router = Router()

/**
 * Get user's journal entries (user-specific data)
 * GET /api/journal/entries
 */
router.get('/entries', async (req: Request, res: Response): Promise<void> => {
  try {
    const { start_date, end_date, limit = 50 } = req.query
    const userId = req.headers['user-id'] as string

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      })
      return
    }

    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId) // Enforce user-specific data access
      .order('entry_date', { ascending: false })
      .limit(parseInt(limit as string))

    // Apply filters
    if (start_date) {
      query = query.gte('entry_date', start_date)
    }
    if (end_date) {
      query = query.lte('entry_date', end_date)
    }

    const { data: entries, error } = await query

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: entries
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch journal entries'
    })
  }
})

/**
 * Get journal entry by ID
 * GET /api/journal/entries/:id
 */
router.get('/entries/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid journal entry ID format'
      })
      return
    }

    const { data: entry, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      res.status(404).json({
        success: false,
        error: 'Journal entry not found'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: entry
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch journal entry'
    })
  }
})

/**
 * Create new journal entry (user-specific)
 * POST /api/journal/entries
 */
router.post('/entries', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      title,
      content,
      entry_date,
      mood,
      tags
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
    if (!title || !content) {
      res.status(400).json({
        success: false,
        error: 'Title and content are required'
      })
      return
    }

    const { data: entry, error } = await supabase
      .from('journal_entries')
      .insert({
        title,
        content,
        entry_date: entry_date || new Date().toISOString().split('T')[0],
        mood,
        tags,
        user_id: userId // Ensure user-specific data
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
      data: entry
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create journal entry'
    })
  }
})

/**
 * Update journal entry
 * PUT /api/journal/entries/:id
 */
router.put('/entries/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      title,
      content,
      entry_date,
      category,
      mood,
      tags
    } = req.body

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid journal entry ID format'
      })
      return
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (entry_date !== undefined) updateData.entry_date = entry_date
    if (category !== undefined) updateData.category = category
    if (mood !== undefined) updateData.mood = mood
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : []

    const { data: entry, error } = await supabase
      .from('journal_entries')
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
      data: entry
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to update journal entry'
    })
  }
})

/**
 * Delete journal entry
 * DELETE /api/journal/entries/:id
 */
router.delete('/entries/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      res.status(400).json({
        success: false,
        error: 'Invalid journal entry ID format'
      })
      return
    }

    const { error } = await supabase
      .from('journal_entries')
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
      message: 'Journal entry deleted successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete journal entry'
    })
  }
})

/**
 * Get journal statistics
 * GET /api/journal/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get total entries count
    const { count: totalEntries, error: countError } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      res.status(400).json({
        success: false,
        error: countError.message
      })
      return
    }

    // Get entries by category and mood
    const { data: entriesData, error: entriesError } = await supabase
      .from('journal_entries')
      .select('category, mood, entry_date')

    if (entriesError) {
      res.status(400).json({
        success: false,
        error: entriesError.message
      })
      return
    }

    // Calculate category and mood counts
    const categoryCounts = entriesData?.reduce((acc: any, entry: any) => {
      acc[entry.category] = (acc[entry.category] || 0) + 1
      return acc
    }, {}) || {}

    const moodCounts = entriesData?.reduce((acc: any, entry: any) => {
      if (entry.mood) {
        acc[entry.mood] = (acc[entry.mood] || 0) + 1
      }
      return acc
    }, {}) || {}

    // Get entries from last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const { count: recentEntries, error: recentError } = await supabase
      .from('journal_entries')
      .select('*', { count: 'exact', head: true })
      .gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0])

    if (recentError) {
      res.status(400).json({
        success: false,
        error: recentError.message
      })
      return
    }

    // Calculate writing streak (consecutive days with entries)
    const sortedDates = entriesData
      ?.map((entry: any) => entry.entry_date)
      .sort()
      .reverse() || []

    let currentStreak = 0
    const today = new Date().toISOString().split('T')[0]
    const checkDate = new Date()

    for (let i = 0; i < 365; i++) { // Check up to a year
      const dateStr = checkDate.toISOString().split('T')[0]
      if (sortedDates.includes(dateStr)) {
        currentStreak++
      } else if (dateStr !== today) {
        // If we miss a day (and it's not today), break the streak
        break
      }
      checkDate.setDate(checkDate.getDate() - 1)
    }

    res.status(200).json({
      success: true,
      data: {
        totalEntries: totalEntries || 0,
        recentEntries: recentEntries || 0,
        categoryCounts,
        moodCounts,
        currentStreak,
        averageEntriesPerWeek: totalEntries ? ((totalEntries / 52) || 0).toFixed(1) : '0.0'
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    })
  }
})

/**
 * Search journal entries
 * GET /api/journal/search
 */
router.get('/search', async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, limit = 20 } = req.query

    if (!q) {
      res.status(400).json({
        success: false,
        error: 'Search query is required'
      })
      return
    }

    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('*')
      .or(`title.ilike.%${q}%,content.ilike.%${q}%`)
      .order('entry_date', { ascending: false })
      .limit(parseInt(limit as string))

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: entries
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to search journal entries'
    })
  }
})

export default router