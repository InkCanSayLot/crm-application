/**
 * Supabase configuration and client initialization
 * Centralized configuration to ensure environment variables are loaded properly
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') })

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