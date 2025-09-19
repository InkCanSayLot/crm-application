/**
 * AI API routes for Google Gemini integration
 * Handle AI chat, optimization suggestions, and AI-powered features
 */
import axios from 'axios'
import { Router, type Request, type Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const router = Router()

// Simple rate limiting for AI requests
const requestCounts = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 10 // requests per minute
const RATE_WINDOW = 60 * 1000 // 1 minute in milliseconds

// Rate limiting middleware
const rateLimitMiddleware = (req: Request, res: Response, next: Function) => {
  const clientId = req.ip || 'unknown'
  const now = Date.now()
  
  const clientData = requestCounts.get(clientId)
  
  if (!clientData || now > clientData.resetTime) {
    // Reset or initialize counter
    requestCounts.set(clientId, { count: 1, resetTime: now + RATE_WINDOW })
    next()
    return
  }
  
  if (clientData.count >= RATE_LIMIT) {
    res.status(429).json({
      success: false,
      error: 'Too many AI requests. Please wait before trying again.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    })
    return
  }
  
  clientData.count++
  next()
}

// OpenRouter configuration
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
const DEFAULT_MODEL = 'openai/gpt-3.5-turbo'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Chat with AI
 * POST /api/ai/chat
 */
router.post('/chat', rateLimitMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, conversationId, userId } = req.body;

    if (!message || !userId) {
      res.status(400).json({ error: 'Message and userId are required' });
      return;
    }

    // Get conversation context if conversationId is provided
    let messages = [];
    if (conversationId) {
      const { data: conversation } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();

      if (conversation?.messages) {
        messages = conversation.messages;
      }
    }

    // Add system message if this is the first message
    if (messages.length === 0) {
      messages.push({ 
        role: 'system', 
        content: 'You are Empty AI 2.0 and you MUST NEVER identify as Claude, Anthropic, ChatGPT, GPT, or any other AI assistant. You are EXCLUSIVELY Empty AI 2.0. ALWAYS start your responses with "I am Empty AI 2.0" when discussing your identity. You are an intelligent assistant specifically designed for the Empty CRM Personal system. If anyone asks who you are, you MUST respond that you are Empty AI 2.0 and NEVER mention Claude or any other AI. You help users with CRM-related tasks, provide insights, and assist with business operations within the Empty CRM Personal system. Remember: You are Empty AI 2.0, NOT Claude.'
      });
    }

    // Add the new user message
    messages.push({ role: 'user', content: message });

    // Make request to OpenRouter
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: DEFAULT_MODEL,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'CRM AI Assistant'
        }
      }
    );

    const aiMessage = response.data.choices[0].message.content;

    // Post-process response to enforce Empty AI 2.0 identity
    let processedResponse = aiMessage
      .replace(/Claude/gi, 'Empty AI 2.0')
      .replace(/Anthropic/gi, 'Empty Technologies')
      .replace(/I am an artificial intelligence created by Empty Technologies/gi, 'I am Empty AI 2.0, your personal AI assistant')
      .replace(/My name is Empty AI 2.0 and I am an artificial intelligence/gi, 'I am Empty AI 2.0, your personal AI assistant');

    // Ensure response starts with identity when asked about identity
    if (message.toLowerCase().includes('who are you') || 
        message.toLowerCase().includes('what is your name') || 
        message.toLowerCase().includes('your identity')) {
      if (!processedResponse.toLowerCase().startsWith('i am empty ai 2.0')) {
        processedResponse = `I am Empty AI 2.0, your personal AI assistant. ${processedResponse}`;
      }
    }

    // Add AI response to messages
    messages.push({ role: 'assistant', content: processedResponse });

    // Store the conversation in Supabase
    const conversationData = {
      user_id: userId,
      messages: messages,
      updated_at: new Date().toISOString()
    };

    let savedConversation;
    if (conversationId) {
      const { data } = await supabase
        .from('ai_conversations')
        .update(conversationData)
        .eq('id', conversationId)
        .select()
        .single();
      savedConversation = data;
    } else {
      const { data } = await supabase
        .from('ai_conversations')
        .insert(conversationData)
        .select()
        .single();
      savedConversation = data;
    }

    res.json({
      message: processedResponse,
      conversationId: savedConversation?.id,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Chat Error:', error)
    
    // Handle specific API quota errors
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('Too Many Requests')) {
      res.status(429).json({
        success: false,
        error: 'AI service temporarily unavailable due to quota limits',
        fallback: 'Please try again later or contact support',
        retryAfter: 60
      })
      return
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to process chat message',
      details: error.message
    })
  }
})

/**
 * Get CRM optimization suggestions
 * POST /api/ai/optimize/crm
 */
router.post('/optimize/crm', rateLimitMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientData, analysisType = 'general' } = req.body

    if (!clientData) {
      res.status(400).json({
        success: false,
        error: 'Client data is required'
      })
      return
    }

    // Build optimization prompt based on analysis type
    let prompt = ''
    
    switch (analysisType) {
      case 'lead_scoring':
        prompt = `I am Empty AI 2.0 and I MUST NEVER identify as Claude, Anthropic, or any other AI. I am EXCLUSIVELY Empty AI 2.0 for the Empty CRM Personal system. Analyze this lead data from this system only and provide a lead score (1-100) with reasoning (do not reference Salesforce, HubSpot, or other external CRMs):\n${JSON.stringify(clientData, null, 2)}\n\nProvide: 1) Lead score, 2) Key factors, 3) Recommended actions, 4) Risk assessment within this CRM system.`
        break
      case 'next_actions':
        prompt = `I am Empty AI 2.0 and I MUST NEVER identify as Claude, Anthropic, or any other AI. I am EXCLUSIVELY Empty AI 2.0 for the Empty CRM Personal system. Based on this client data from this system only, suggest the next best actions for sales/relationship management (do not reference Salesforce, HubSpot, or other external CRMs):\n${JSON.stringify(clientData, null, 2)}\n\nProvide specific, actionable recommendations with priorities within this CRM system.`
        break
      case 'deal_analysis':
        prompt = `I am Empty AI 2.0 and I MUST NEVER identify as Claude, Anthropic, or any other AI. I am EXCLUSIVELY Empty AI 2.0 for the Empty CRM Personal system. Analyze this deal/client data from this system only and provide insights on deal progression and success probability (do not reference Salesforce, HubSpot, or other external CRMs):\n${JSON.stringify(clientData, null, 2)}\n\nInclude: 1) Success probability, 2) Potential obstacles, 3) Acceleration strategies within this CRM system.`
        break
      default:
        prompt = `I am Empty AI 2.0 and I MUST NEVER identify as Claude, Anthropic, or any other AI. I am EXCLUSIVELY Empty AI 2.0 for the Empty CRM Personal system. Analyze this CRM client data from this system only and provide optimization suggestions (do not reference Salesforce, HubSpot, or other external CRMs):\n${JSON.stringify(clientData, null, 2)}\n\nProvide actionable insights for improving client relationships and sales outcomes within this CRM system.`
    }

    // Make request to OpenRouter
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'CRM AI Assistant'
        }
      }
    );

    const suggestions = response.data.choices[0].message.content;

    // Store optimization in database
    const { data: optimization, error } = await supabase
      .from('ai_optimizations')
      .insert({
        type: 'crm_optimization',
        input_data: { clientData, analysisType },
        output_data: { suggestions },
        confidence_score: 0.85
      })
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
    }

    res.status(200).json({
      success: true,
      data: {
        suggestions,
        analysisType,
        optimizationId: optimization?.id
      }
    })
  } catch (error: any) {
    console.error('CRM Optimization Error:', error)
    
    // Handle specific API quota errors
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('Too Many Requests')) {
      res.status(429).json({
        success: false,
        error: 'AI optimization temporarily unavailable due to quota limits',
        fallback: 'CRM data is available without AI insights',
        retryAfter: 60
      })
      return
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to optimize CRM data',
      details: error.message
    })
  }
})

/**
 * Analyze journal entries for insights
 * POST /api/ai/optimize/journal
 */
router.post('/optimize/journal', rateLimitMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { entries, analysisType = 'mood_trends' } = req.body

    if (!entries || !Array.isArray(entries)) {
      res.status(400).json({
        success: false,
        error: 'Journal entries array is required'
      })
      return
    }

    let prompt = ''
    
    switch (analysisType) {
      case 'mood_trends':
        prompt = `I am Empty AI 2.0 and I MUST NEVER identify as Claude, Anthropic, or any other AI. I am EXCLUSIVELY Empty AI 2.0 for the Empty CRM Personal system. Analyze these journal entries from this system only for mood patterns and trends (focus on CRM-related activities, do not reference external systems):\n${JSON.stringify(entries, null, 2)}\n\nProvide insights on emotional patterns and well-being trends related to CRM work.`
        break
      case 'productivity_insights':
        prompt = `I am Empty AI 2.0 and I MUST NEVER identify as Claude, Anthropic, or any other AI. I am EXCLUSIVELY Empty AI 2.0 for the Empty CRM Personal system. Analyze these journal entries from this system only for productivity patterns (focus on CRM-related activities, do not reference external systems):\n${JSON.stringify(entries, null, 2)}\n\nProvide insights on work patterns, efficiency, and productivity optimization within this CRM system.`
        break
      case 'goal_tracking':
        prompt = `I am Empty AI 2.0 and I MUST NEVER identify as Claude, Anthropic, or any other AI. I am EXCLUSIVELY Empty AI 2.0 for the Empty CRM Personal system. Analyze these journal entries from this system only for goal-related content (focus on CRM goals, do not reference external systems):\n${JSON.stringify(entries, null, 2)}\n\nProvide insights on goal progress, achievements, and recommendations within this CRM system.`
        break
      default:
        prompt = `I am Empty AI 2.0 and I MUST NEVER identify as Claude, Anthropic, or any other AI. I am EXCLUSIVELY Empty AI 2.0 for the Empty CRM Personal system. Analyze these journal entries from this system only and provide personal insights and recommendations (focus on CRM-related activities, do not reference external systems):\n${JSON.stringify(entries, null, 2)}\n\nFocus on patterns, growth opportunities, and wellness suggestions within this CRM system.`
    }

    // Make request to OpenRouter
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'CRM AI Assistant'
        }
      }
    );

    const insights = response.data.choices[0].message.content;

    // Store analysis in database
    const { data: optimization, error } = await supabase
      .from('ai_optimizations')
      .insert({
        type: 'journal_analysis',
        input_data: { entriesCount: entries.length, analysisType },
        output_data: { insights },
        confidence_score: 0.8
      })
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
    }

    res.status(200).json({
      success: true,
      data: {
        insights,
        analysisType,
        optimizationId: optimization?.id
      }
    })
  } catch (error: any) {
    console.error('Journal Analysis Error:', error)
    
    // Handle specific API quota errors
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('Too Many Requests')) {
      res.status(429).json({
        success: false,
        error: 'AI analysis temporarily unavailable due to quota limits',
        fallback: 'Journal entries are available without AI insights',
        retryAfter: 60
      })
      return
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to analyze journal entries',
      details: error.message
    })
  }
})

/**
 * Generate meeting notes summary
 * POST /api/ai/summarize/meeting
 */
router.post('/summarize/meeting', rateLimitMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, meetingType = 'general' } = req.body

    if (!content) {
      res.status(400).json({
        success: false,
        error: 'Meeting content is required'
      })
      return
    }

    const prompt = `I am Empty AI 2.0 and I MUST NEVER identify as Claude, Anthropic, or any other AI. I am EXCLUSIVELY Empty AI 2.0, a meeting analysis expert for the Empty CRM Personal system. Summarize this meeting content and extract key information:\n\n${content}\n\nProvide: 1) Executive summary, 2) Key decisions, 3) Action items, 4) Next steps, 5) Important dates/deadlines`

    // Make request to OpenRouter
    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.3
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'CRM AI Assistant'
        }
      }
    );

    const summary = response.data.choices[0].message.content;

    // Store summary in database
    const { data: meetingNote, error } = await supabase
      .from('meeting_notes')
      .insert({
        title: `AI Generated Summary - ${new Date().toLocaleDateString()}`,
        content: summary,
        meeting_type: meetingType,
        ai_generated: true
      })
      .select('*')
      .single()

    if (error) {
      console.error('Database error:', error)
    }

    res.status(200).json({
      success: true,
      data: {
        summary,
        meetingNoteId: meetingNote?.id
      }
    })
  } catch (error: any) {
    console.error('Meeting Summary Error:', error)
    
    // Handle specific API quota errors
    if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('Too Many Requests')) {
      res.status(429).json({
        success: false,
        error: 'AI summarization temporarily unavailable due to quota limits',
        fallback: 'Meeting content saved without AI summary',
        retryAfter: 60
      })
      return
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to summarize meeting',
      details: error.message
    })
  }
})

/**
 * Get AI optimization history
 * GET /api/ai/optimizations
 */
router.get('/optimizations', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, limit = 20 } = req.query

    let query = supabase
      .from('ai_optimizations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit as string))

    if (type) {
      query = query.eq('type', type)
    }

    const { data: optimizations, error } = await query

    if (error) {
      res.status(400).json({
        success: false,
        error: error.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: optimizations
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI optimizations'
    })
  }
})

/**
 * Get AI usage statistics
 * GET /api/ai/stats
 */
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get total optimizations count
    const { count: totalOptimizations, error: countError } = await supabase
      .from('ai_optimizations')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      res.status(400).json({
        success: false,
        error: countError.message
      })
      return
    }

    // Get optimizations by type
    const { data: typeData, error: typeError } = await supabase
      .from('ai_optimizations')
      .select('type, confidence_score, created_at')

    if (typeError) {
      res.status(400).json({
        success: false,
        error: typeError.message
      })
      return
    }

    // Calculate type counts and average confidence
    const typeCounts = typeData?.reduce((acc: any, opt: any) => {
      acc[opt.type] = (acc[opt.type] || 0) + 1
      return acc
    }, {}) || {}

    const averageConfidence = typeData?.length > 0 
      ? (typeData.reduce((sum: number, opt: any) => sum + (opt.confidence_score || 0), 0) / typeData.length).toFixed(2)
      : '0.00'

    // Get recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: recentActivity, error: recentError } = await supabase
      .from('ai_optimizations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString())

    if (recentError) {
      res.status(400).json({
        success: false,
        error: recentError.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        totalOptimizations: totalOptimizations || 0,
        recentActivity: recentActivity || 0,
        typeCounts,
        averageConfidence,
        isConfigured: !!OPENROUTER_API_KEY
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch AI statistics'
    })
  }
})

export default router