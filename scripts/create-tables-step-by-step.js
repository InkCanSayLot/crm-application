#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔧 Creating database tables step by step...\n');
console.log(`📡 Connected to: ${supabaseUrl}\n`);

// Step-by-step table creation
const steps = [
  {
    name: 'Enable UUID Extension',
    sql: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`
  },
  {
    name: 'Create Users Table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_online BOOLEAN DEFAULT false,
        last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'Create Clients Table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.clients (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        company TEXT,
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        car_make TEXT,
        car_model TEXT,
        car_year INTEGER,
        last_contact_note TEXT
      );
    `
  },
  {
    name: 'Create Tasks Table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.tasks (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'pending',
        priority TEXT DEFAULT 'medium',
        due_date TIMESTAMP WITH TIME ZONE,
        client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
        task_group_id UUID
      );
    `
  },
  {
    name: 'Create Calendar Events Table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.calendar_events (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        event_type TEXT DEFAULT 'meeting',
        location TEXT,
        is_all_day BOOLEAN DEFAULT false
      );
    `
  },
  {
    name: 'Create Journal Entries Table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.journal_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        mood TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'Create Chat Rooms Table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.chat_rooms (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        description TEXT,
        is_general BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'Create Chat Messages Table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.chat_messages (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'Create Task Groups Table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.task_groups (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        description TEXT,
        color TEXT DEFAULT '#3B82F6',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  },
  {
    name: 'Create Notifications Table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
  }
];

async function executeStep(step) {
  try {
    console.log(`🔄 ${step.name}...`);
    
    // Try multiple approaches to execute SQL
    let success = false;
    let error = null;

    // Approach 1: Try RPC exec
    try {
      const { data, error: rpcError } = await supabase.rpc('exec', { sql: step.sql });
      if (!rpcError) {
        success = true;
        console.log(`✅ ${step.name} - Success via RPC`);
      } else {
        error = rpcError;
      }
    } catch (e) {
      error = e;
    }

    // Approach 2: Try REST API if RPC failed
    if (!success) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: step.sql })
        });

        if (response.ok) {
          success = true;
          console.log(`✅ ${step.name} - Success via REST API`);
        } else {
          const errorText = await response.text();
          error = new Error(`REST API failed: ${response.status} - ${errorText}`);
        }
      } catch (e) {
        error = e;
      }
    }

    if (!success) {
      console.log(`⚠️  ${step.name} - Failed: ${error?.message || 'Unknown error'}`);
      return false;
    }

    return true;
  } catch (error) {
    console.log(`❌ ${step.name} - Error: ${error.message}`);
    return false;
  }
}

async function createTables() {
  let successCount = 0;
  let failCount = 0;

  for (const step of steps) {
    const success = await executeStep(step);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Small delay between steps
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Results: ${successCount} successful, ${failCount} failed`);
  
  if (successCount > 0) {
    console.log('\n🎉 Some tables were created! Let me verify...');
    
    // Wait a moment for schema cache to update
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Run verification
    console.log('\n🔍 Running verification...');
    const { spawn } = await import('child_process');
    const child = spawn('node', ['scripts/check-tables.js'], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ Verification completed!');
      } else {
        console.log('\n⚠️  Verification had issues, but tables may still exist.');
      }
    });
  } else {
    console.log('\n❌ No tables were created successfully.');
    console.log('\n💡 Next steps:');
    console.log('1. Check your Supabase project permissions');
    console.log('2. Verify the Service Role Key has admin privileges');
    console.log('3. Try creating tables manually in the Supabase Dashboard');
  }
}

await createTables();