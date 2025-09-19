/**
 * User authentication API routes with Supabase Auth
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const router = Router()

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * User Registration
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      })
      return
    }

    // Register user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0]
        }
      }
    })

    if (authError) {
      res.status(400).json({
        success: false,
        error: authError.message
      })
      return
    }

    res.status(201).json({
      success: true,
      data: {
        user: authData.user,
        session: authData.session
      },
      message: 'User registered successfully'
    })
  } catch (error: any) {
    console.error('Registration Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
      details: error.message
    })
  }
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: 'Email and password are required'
      })
      return
    }

    // Sign in user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      res.status(401).json({
        success: false,
        error: authError.message
      })
      return
    }

    res.status(200).json({
      success: true,
      data: {
        user: authData.user,
        session: authData.session
      },
      message: 'Login successful'
    })
  } catch (error: any) {
    console.error('Login Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to login user',
      details: error.message
    })
  }
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (token) {
      // Set the session for logout
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: ''
      })
      
      // Sign out
      await supabase.auth.signOut()
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error: any) {
    console.error('Logout Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to logout user',
      details: error.message
    })
  }
})

/**
 * Get Current User
 * GET /api/auth/user
 */
router.get('/user', async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      })
      return
    }

    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      })
      return
    }

    res.status(200).json({
      success: true,
      data: { user }
    })
  } catch (error: any) {
    console.error('Get User Error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get user',
      details: error.message
    })
  }
})

export default router
