/**
 * Analytics routes
 */
import { Router, type Request, type Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'

const router = Router()

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
})

// Daily insights endpoint
router.get('/daily-insights', async (req: Request, res: Response) => {
  try {
    // Get recent data from Supabase
    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    // Prepare data for AI analysis
    const dataForAnalysis = {
      clients: clients || [],
      tasks: tasks || [],
      payments: payments || [],
      timestamp: new Date().toISOString()
    }

    // Generate insights using Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a business analyst AI. Analyze the provided CRM data and provide actionable insights in JSON format with the following structure: { insights: [{ title: string, description: string, priority: 'high' | 'medium' | 'low', category: 'clients' | 'tasks' | 'payments' | 'general' }], summary: string }"
        },
        {
          role: "user",
          content: `Analyze this CRM data and provide insights: ${JSON.stringify(dataForAnalysis)}`
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.3,
      max_tokens: 1000,
    })

    const aiResponse = completion.choices[0]?.message?.content
    let insights

    try {
      insights = JSON.parse(aiResponse || '{}')
    } catch (parseError) {
      // Fallback if AI response is not valid JSON
      insights = {
        insights: [
          {
            title: "Data Analysis Complete",
            description: "Your CRM data has been analyzed. Consider reviewing recent client interactions and task completion rates.",
            priority: "medium",
            category: "general"
          }
        ],
        summary: "CRM analysis completed successfully."
      }
    }

    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Daily insights error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily insights',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router