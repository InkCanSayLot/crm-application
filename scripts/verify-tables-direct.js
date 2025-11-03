#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🔍 Verifying database tables directly...\n');
console.log(`📡 Connected to: ${supabaseUrl}\n`);

async function checkTablesDirectly() {
  try {
    // Query information_schema to get all tables
    const { data: tables, error } = await supabase
      .rpc('exec', {
        sql: `
          SELECT table_name, table_type 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          ORDER BY table_name;
        `
      });

    if (error) {
      console.log('⚠️  RPC exec not available, trying direct query...');
      
      // Try alternative approach using raw SQL
      const { data: rawData, error: rawError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_type')
        .eq('table_schema', 'public')
        .eq('table_type', 'BASE TABLE');

      if (rawError) {
        console.log('⚠️  Direct query failed, trying REST API...');
        
        // Try REST API approach
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({
            sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
          })
        });

        if (response.ok) {
          const restData = await response.json();
          console.log('✅ Tables found via REST API:', restData);
        } else {
          console.log('❌ REST API failed:', response.status, response.statusText);
          
          // Final fallback - check if we can at least connect
          const { data: testData, error: testError } = await supabase
            .from('pg_tables')
            .select('tablename')
            .eq('schemaname', 'public')
            .limit(10);

          if (testError) {
            console.log('❌ Cannot query database:', testError.message);
          } else {
            console.log('✅ Database connection works, found tables:', testData?.map(t => t.tablename) || []);
          }
        }
      } else {
        console.log('✅ Tables found via direct query:', rawData);
      }
    } else {
      console.log('✅ Tables found via RPC:', tables);
    }

    // Also check storage buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    if (bucketError) {
      console.log('❌ Storage bucket check failed:', bucketError.message);
    } else {
      console.log('✅ Storage buckets:', buckets.map(b => b.name).join(', '));
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// Expected tables
const expectedTables = [
  'users', 'clients', 'deals', 'calendar_events', 'tasks', 
  'journal_entries', 'chat_rooms', 'chat_messages', 'task_groups', 'notifications'
];

console.log('📋 Expected tables:', expectedTables.join(', '));
console.log('─'.repeat(60));

await checkTablesDirectly();