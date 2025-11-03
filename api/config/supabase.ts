/**
 * Supabase configuration and client initialization
 * Railway provides environment variables directly in production
 * For development, ensure .env file is loaded by the main server entry point
 */
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables first
dotenv.config()

// Validate environment variables
const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL is required but not found in environment variables')
}

if (!supabaseAnonKey) {
  throw new Error('SUPABASE_ANON_KEY is required but not found in environment variables')
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required but not found in environment variables')
}

// Create Supabase clients
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
export const supabaseServiceClient = createClient(supabaseUrl, supabaseServiceKey)

// Export configuration
export const config = {
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceKey
}