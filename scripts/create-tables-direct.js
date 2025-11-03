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

async function createTables() {
    console.log('🚀 Creating database tables...');
    console.log(`📡 Connecting to: ${supabaseUrl}`);
    
    // Test connection by trying to access a table
    try {
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
            
        if (error) {
            if (error.message.includes('relation "users" does not exist')) {
                console.log('📋 Database is empty - tables need to be created');
                console.log('\n❌ Cannot create tables programmatically through Supabase API');
                console.log('🔧 Manual setup required in Supabase dashboard');
                
                console.log('\n📋 Please follow these steps:');
                console.log('1. Open https://supabase.com/dashboard');
                console.log('2. Select your dosatwork@gmail.com project');
                console.log('3. Go to SQL Editor');
                console.log('4. Copy the entire content from setup-database-schema.sql');
                console.log('5. Paste it and click Run');
                
                console.log('\n📄 The SQL file includes:');
                console.log('   ✅ All 8 required tables (users, clients, tasks, etc.)');
                console.log('   ✅ Proper indexes and constraints');
                console.log('   ✅ Row Level Security policies');
                console.log('   ✅ Storage bucket for avatars');
                console.log('   ✅ Initial general chat room');
                
                return false;
            } else {
                console.error('❌ Connection error:', error.message);
                return false;
            }
        } else {
            console.log('✅ Database connection successful - tables exist!');
            
            // Check if we can access other tables
            const tables = ['clients', 'tasks', 'calendar_events', 'journal_entries', 'chat_rooms', 'chat_messages'];
            const existingTables = [];
            const missingTables = [];
            
            for (const table of tables) {
                try {
                    const { error: tableError } = await supabase
                        .from(table)
                        .select('count')
                        .limit(1);
                        
                    if (tableError) {
                        missingTables.push(table);
                    } else {
                        existingTables.push(table);
                    }
                } catch (err) {
                    missingTables.push(table);
                }
            }
            
            console.log(`📋 Existing tables: ${existingTables.length > 0 ? existingTables.join(', ') : 'users only'}`);
            if (missingTables.length > 0) {
                console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
                console.log('\n🔧 Some tables are missing. Please run the SQL script manually.');
                return false;
            } else {
                console.log('✅ All required tables exist!');
                
                // Check storage bucket
                const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
                if (bucketsError) {
                    console.log('⚠️  Could not check storage buckets:', bucketsError.message);
                } else {
                    const bucketNames = buckets.map(b => b.name);
                    if (bucketNames.includes('avatars')) {
                        console.log('✅ Avatars storage bucket exists');
                    } else {
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
                
                return true;
            }
        }
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        return false;
    }
}

// Run the table creation
createTables()
    .then(success => {
        if (success) {
            console.log('\n🎉 Database schema is ready!');
        } else {
            console.log('\n⏳ Waiting for manual schema setup...');
        }
    })
    .catch(error => {
        console.error('❌ Failed:', error);
        process.exit(1);
    });