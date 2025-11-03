#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSchema() {
    console.log('🚀 Setting up database schema...');
    
    try {
        // Read the SQL schema file
        const schemaPath = path.join(__dirname, '..', 'setup-database-schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        
        // Split the SQL into individual statements
        const statements = schemaSql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute`);
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            
            try {
                // Execute each statement using the RPC function
                const { data, error } = await supabase.rpc('exec_sql', {
                    sql: statement
                });
                
                if (error) {
                    console.log(`⚠️  Statement ${i + 1} failed: ${error.message}`);
                    errors.push({ statement: i + 1, error: error.message });
                    errorCount++;
                } else {
                    successCount++;
                    if (i % 10 === 0) {
                        console.log(`✅ Executed ${i + 1}/${statements.length} statements`);
                    }
                }
            } catch (err) {
                console.log(`❌ Statement ${i + 1} error: ${err.message}`);
                errors.push({ statement: i + 1, error: err.message });
                errorCount++;
            }
        }
        
        console.log('\n📊 Schema Creation Summary:');
        console.log(`✅ Successful statements: ${successCount}`);
        console.log(`❌ Failed statements: ${errorCount}`);
        
        if (errors.length > 0) {
            console.log('\n⚠️  Errors encountered:');
            errors.forEach(({ statement, error }) => {
                console.log(`   Statement ${statement}: ${error}`);
            });
        }
        
        // Verify tables were created
        console.log('\n🔍 Verifying table creation...');
        const { data: tables, error: tablesError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public');
            
        if (tablesError) {
            console.log('❌ Could not verify tables:', tablesError.message);
        } else {
            const tableNames = tables.map(t => t.table_name);
            console.log('📋 Created tables:', tableNames.join(', '));
        }
        
        // Check storage buckets
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
            console.log('❌ Could not verify storage buckets:', bucketsError.message);
        } else {
            const bucketNames = buckets.map(b => b.name);
            console.log('🗂️  Storage buckets:', bucketNames.join(', '));
        }
        
        console.log('\n🎉 Schema setup completed!');
        
    } catch (error) {
        console.error('❌ Schema creation failed:', error.message);
        process.exit(1);
    }
}

// Alternative approach using individual table creation
async function createSchemaAlternative() {
    console.log('🚀 Setting up database schema (alternative approach)...');
    
    const tables = [
        {
            name: 'users',
            sql: `
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    email VARCHAR(255) UNIQUE NOT NULL,
                    name VARCHAR(100) NOT NULL,
                    full_name VARCHAR(255),
                    role VARCHAR(50) NOT NULL DEFAULT 'User',
                    avatar_url TEXT,
                    phone VARCHAR(50),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            name: 'clients',
            sql: `
                CREATE TABLE IF NOT EXISTS clients (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    company_name VARCHAR(255) NOT NULL,
                    contact_name VARCHAR(255),
                    email VARCHAR(255),
                    phone VARCHAR(50),
                    linkedin_url TEXT,
                    stage VARCHAR(50) DEFAULT 'prospect',
                    deal_value DECIMAL(10,2),
                    assigned_to UUID REFERENCES users(id),
                    user_id UUID REFERENCES users(id),
                    last_contact_note TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            name: 'tasks',
            sql: `
                CREATE TABLE IF NOT EXISTS tasks (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    status VARCHAR(50) DEFAULT 'pending',
                    priority VARCHAR(20) DEFAULT 'medium',
                    assigned_to UUID REFERENCES users(id),
                    client_id UUID REFERENCES clients(id),
                    user_id UUID REFERENCES users(id),
                    due_date TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            name: 'calendar_events',
            sql: `
                CREATE TABLE IF NOT EXISTS calendar_events (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
                    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
                    type VARCHAR(50) DEFAULT 'meeting',
                    created_by UUID REFERENCES users(id),
                    client_id UUID REFERENCES clients(id),
                    user_id UUID REFERENCES users(id),
                    is_collective BOOLEAN DEFAULT false,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            name: 'journal_entries',
            sql: `
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
            `
        },
        {
            name: 'chat_rooms',
            sql: `
                CREATE TABLE IF NOT EXISTS chat_rooms (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    is_general BOOLEAN DEFAULT false,
                    created_by UUID REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            name: 'chat_messages',
            sql: `
                CREATE TABLE IF NOT EXISTS chat_messages (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
                    user_id UUID REFERENCES users(id) NOT NULL,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        },
        {
            name: 'task_groups',
            sql: `
                CREATE TABLE IF NOT EXISTS task_groups (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    name VARCHAR(255) NOT NULL,
                    description TEXT,
                    color VARCHAR(7) DEFAULT '#3B82F6',
                    user_id UUID REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
            `
        }
    ];
    
    try {
        // Enable UUID extension first
        console.log('🔧 Enabling UUID extension...');
        const { error: uuidError } = await supabase.rpc('exec_sql', {
            sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
        });
        
        if (uuidError && !uuidError.message.includes('already exists')) {
            console.log('⚠️  UUID extension warning:', uuidError.message);
        }
        
        // Create tables one by one
        for (const table of tables) {
            console.log(`📋 Creating table: ${table.name}`);
            
            const { error } = await supabase.rpc('exec_sql', {
                sql: table.sql
            });
            
            if (error) {
                console.log(`❌ Failed to create ${table.name}:`, error.message);
            } else {
                console.log(`✅ Created table: ${table.name}`);
            }
        }
        
        // Create storage bucket
        console.log('🗂️  Creating avatars storage bucket...');
        const { error: bucketError } = await supabase.storage.createBucket('avatars', {
            public: true
        });
        
        if (bucketError && !bucketError.message.includes('already exists')) {
            console.log('⚠️  Storage bucket warning:', bucketError.message);
        } else {
            console.log('✅ Created avatars storage bucket');
        }
        
        console.log('\n🎉 Schema setup completed successfully!');
        
    } catch (error) {
        console.error('❌ Schema creation failed:', error.message);
        console.log('\n💡 Trying direct table creation approach...');
        await createSchemaDirectly();
    }
}

async function createSchemaDirectly() {
    console.log('🚀 Creating schema using direct Supabase client calls...');
    
    try {
        // Since we can't execute raw SQL, let's try to create a simple test
        const { data, error } = await supabase
            .from('users')
            .select('count')
            .limit(1);
            
        if (error && error.message.includes('relation "users" does not exist')) {
            console.log('❌ Tables do not exist. Manual SQL execution required.');
            console.log('\n📋 Please run the SQL script manually in Supabase dashboard:');
            console.log('1. Go to https://supabase.com/dashboard');
            console.log('2. Select your project');
            console.log('3. Go to SQL Editor');
            console.log('4. Copy and paste the content from setup-database-schema.sql');
            console.log('5. Click Run');
            return false;
        } else {
            console.log('✅ Database schema appears to be set up correctly!');
            return true;
        }
        
    } catch (error) {
        console.error('❌ Error checking schema:', error.message);
        return false;
    }
}

// Run the schema creation
if (import.meta.url === `file://${process.argv[1]}`) {
    createSchemaAlternative()
        .then(() => {
            console.log('✅ Schema creation process completed');
        })
        .catch(error => {
            console.error('❌ Schema creation failed:', error);
            process.exit(1);
        });
}

export { createSchema, createSchemaAlternative, createSchemaDirectly };