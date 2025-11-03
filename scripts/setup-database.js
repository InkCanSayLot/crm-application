#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setupDatabase() {
    console.log('🚀 Setting up database schema...\n');

    // Initialize Supabase client
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log(`📡 Connected to: ${process.env.SUPABASE_URL}\n`);

    try {
        // Test connection
        const { data, error } = await supabase.from('users').select('count').limit(1);
        
        if (error && error.code === 'PGRST116') {
            console.log('📋 Database is empty. Creating tables...\n');
            
            // Create tables using SQL
            const createTablesSQL = `
                -- Enable UUID extension
                CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

                -- Users Table
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    full_name VARCHAR(255),
                    role VARCHAR(50) NOT NULL CHECK (role IN ('CEO', 'CGO', 'CTO', 'Admin', 'User')),
                    avatar_url TEXT,
                    phone VARCHAR(50),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                -- Clients Table
                CREATE TABLE IF NOT EXISTS clients (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    company_name VARCHAR(255) NOT NULL,
                    contact_name VARCHAR(255),
                    email VARCHAR(255),
                    phone VARCHAR(50),
                    linkedin_url TEXT,
                    stage VARCHAR(50) DEFAULT 'prospect' CHECK (stage IN ('prospect', 'connected', 'replied', 'meeting', 'proposal', 'closed', 'lost')),
                    deal_value DECIMAL(10,2),
                    assigned_to UUID REFERENCES users(id),
                    user_id UUID REFERENCES users(id),
                    last_contact_note TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                -- Tasks Table
                CREATE TABLE IF NOT EXISTS tasks (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
                    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
                    assigned_to UUID REFERENCES users(id),
                    client_id UUID REFERENCES clients(id),
                    user_id UUID REFERENCES users(id),
                    due_date TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                -- Calendar Events Table
                CREATE TABLE IF NOT EXISTS calendar_events (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
                    type VARCHAR(50) DEFAULT 'meeting' CHECK (type IN ('meeting', 'sync', 'block', 'personal')),
                    created_by UUID REFERENCES users(id),
                    client_id UUID REFERENCES clients(id),
                    user_id UUID REFERENCES users(id),
                    is_collective BOOLEAN DEFAULT false,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                -- Journal Entries Table
                CREATE TABLE IF NOT EXISTS journal_entries (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    user_id UUID REFERENCES users(id) NOT NULL,
                    title VARCHAR(255),
                    category VARCHAR(100),
                    content TEXT NOT NULL,
                    mood VARCHAR(50),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                -- Chat Rooms Table
                CREATE TABLE IF NOT EXISTS chat_rooms (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    is_general BOOLEAN DEFAULT false,
                    created_by UUID REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                -- Chat Messages Table
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
                    user_id UUID REFERENCES users(id) NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );

                -- Create indexes
                CREATE INDEX IF NOT EXISTS idx_clients_assigned_to ON clients(assigned_to);
                CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
                CREATE INDEX IF NOT EXISTS idx_clients_stage ON clients(stage);
                CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
                CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
                CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
                CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON calendar_events(user_id);
                CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
                CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
                CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);

                -- Enable Row Level Security
                ALTER TABLE users ENABLE ROW LEVEL SECURITY;
                ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
                ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
                ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
                ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
                ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
                ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

                -- Create RLS Policies
                CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
                CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

                CREATE POLICY "Users can view own clients" ON clients FOR SELECT USING (auth.uid() = user_id);
                CREATE POLICY "Users can manage own clients" ON clients FOR ALL USING (auth.uid() = user_id);

                CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);
                CREATE POLICY "Users can manage own tasks" ON tasks FOR ALL USING (auth.uid() = user_id);

                CREATE POLICY "Users can view own calendar events" ON calendar_events FOR SELECT USING (auth.uid() = user_id);
                CREATE POLICY "Users can manage own calendar events" ON calendar_events FOR ALL USING (auth.uid() = user_id);

                CREATE POLICY "Users can view own journal entries" ON journal_entries FOR SELECT USING (auth.uid() = user_id);
                CREATE POLICY "Users can manage own journal entries" ON journal_entries FOR ALL USING (auth.uid() = user_id);

                CREATE POLICY "Users can view all chat rooms" ON chat_rooms FOR SELECT USING (true);
                CREATE POLICY "Users can create chat rooms" ON chat_rooms FOR INSERT WITH CHECK (auth.uid() = created_by);

                CREATE POLICY "Users can view all chat messages" ON chat_messages FOR SELECT USING (true);
                CREATE POLICY "Users can create own messages" ON chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
            `;

            console.log('📝 Creating database schema...');
            
            // We'll need to use the SQL editor in Supabase dashboard for this
            console.log('\n⚠️  IMPORTANT: Manual Step Required');
            console.log('Since we cannot execute raw SQL directly, please:');
            console.log('1. Go to your Supabase dashboard');
            console.log('2. Navigate to SQL Editor');
            console.log('3. Copy and paste the SQL from the migration files');
            console.log('4. Run the initial schema migration\n');
            
            return false;
        } else {
            console.log('✅ Database connection successful!');
            console.log('📋 Tables already exist or are accessible\n');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Database setup error:', error.message);
        return false;
    }
}

// Execute setup if run directly
if (process.argv[1] && process.argv[1].endsWith('setup-database.js')) {
    setupDatabase().catch(console.error);
}

export { setupDatabase };