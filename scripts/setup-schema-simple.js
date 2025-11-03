#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSchema() {
    console.log('🚀 Setting up database schema...');
    console.log(`📡 Connecting to: ${supabaseUrl}`);
    
    try {
        // Test connection first
        const { data: testData, error: testError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .limit(1);
            
        if (testError) {
            console.error('❌ Connection test failed:', testError.message);
            return;
        }
        
        console.log('✅ Connected to Supabase successfully');
        
        // Check existing tables
        const { data: existingTables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
            
        if (tablesError) {
            console.log('⚠️  Could not check existing tables:', tablesError.message);
        } else {
            const tableNames = existingTables.map(t => t.table_name);
            console.log('📋 Existing tables:', tableNames.length > 0 ? tableNames.join(', ') : 'None');
            
            const requiredTables = ['users', 'clients', 'tasks', 'calendar_events', 'journal_entries', 'chat_rooms', 'chat_messages', 'task_groups'];
            const missingTables = requiredTables.filter(table => !tableNames.includes(table));
            
            if (missingTables.length === 0) {
                console.log('✅ All required tables already exist!');
                
                // Check storage buckets
                const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
                if (bucketsError) {
                    console.log('⚠️  Could not check storage buckets:', bucketsError.message);
                } else {
                    const bucketNames = buckets.map(b => b.name);
                    console.log('🗂️  Storage buckets:', bucketNames.length > 0 ? bucketNames.join(', ') : 'None');
                    
                    if (!bucketNames.includes('avatars')) {
                        console.log('🗂️  Creating avatars storage bucket...');
                        const { error: bucketError } = await supabase.storage.createBucket('avatars', {
                            public: true
                        });
                        
                        if (bucketError) {
                            console.log('❌ Failed to create avatars bucket:', bucketError.message);
                        } else {
                            console.log('✅ Created avatars storage bucket');
                        }
                    }
                }
                
                return;
            }
            
            console.log('❌ Missing tables:', missingTables.join(', '));
        }
        
        // Since we can't execute raw SQL through the API, provide manual instructions
        console.log('\n📋 Manual Setup Required:');
        console.log('The database schema needs to be set up manually in the Supabase dashboard.');
        console.log('\n🔧 Steps to complete setup:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your dosatwork@gmail.com project');
        console.log('3. Navigate to SQL Editor');
        console.log('4. Copy the content from setup-database-schema.sql');
        console.log('5. Paste it into the SQL Editor');
        console.log('6. Click "Run" to execute');
        console.log('\n💡 The SQL file contains all necessary tables, indexes, and policies.');
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
    }
}

// Run the setup
setupSchema();