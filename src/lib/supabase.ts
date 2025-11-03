import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'CEO' | 'CGO' | 'CTO';
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  stage: 'lead' | 'prospect' | 'connected' | 'replied' | 'meeting' | 'proposal' | 'closed' | 'lost';
  deal_value?: number;
  number_of_cars?: number;
  commitment_length?: number;
  per_car_value?: number;
  setup_fee?: number;
  assigned_to?: string;
  notes?: string;
  profile_image_url?: string;
  last_contact?: string;
  last_contact_note?: string;
  created_at: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  client_id?: string;
  user_id?: string;
  type: 'linkedin_connection' | 'linkedin_message' | 'email' | 'phone_call' | 'meeting';
  status: 'sent' | 'received' | 'replied' | 'ignored' | 'completed';
  content?: string;
  notes?: string;
  interaction_date: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed';
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  assigned_to?: string;
  client_id?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  type: 'meeting' | 'reminder' | 'appointment' | 'other';
  created_by?: string;
  client_id?: string;
  is_collective: boolean;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id?: string;
  title: string;
  content: string;
  category: string;
  mood: string;
  sales_accomplishment?: string;
  marketing_accomplishment?: string;
  ops_accomplishment?: string;
  tech_accomplishment?: string;
  random_thoughts?: string;
  entry_date: string;
  created_at: string;
}

export interface MeetingNote {
  id: string;
  calendar_event_id?: string;
  created_by?: string;
  raw_notes?: string;
  ai_summary?: string;
  action_items?: any[];
  meeting_date: string;
  created_at: string;
}

export interface AIOptimization {
  id: string;
  interaction_id?: string;
  message_type: string;
  original_message?: string;
  optimized_message?: string;
  performance_score?: number;
  created_at: string;
}

// Export alias for backward compatibility
export type Event = CalendarEvent;