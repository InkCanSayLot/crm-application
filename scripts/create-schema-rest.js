import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

console.log('🚀 DIRECT SCHEMA CREATION');
console.log('==================================================');
console.log(`📡 Target: ${supabaseUrl}`);

async function executeSQL(sql, description) {
    try {
        console.log(`🔄 ${description}...`);
        
        // Use the REST API directly to execute SQL
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ sql })
        });

        if (response.ok) {
            console.log(`✅ ${description} - SUCCESS`);
            return true;
        } else {
            const error = await response.text();
            console.log(`⚠️  ${description} - ${error}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ ${description} - ${error.message}`);
        return false;
    }
}

async function createSchema() {
    console.log('\n📋 Creating database schema...\n');

    // Enable UUID extension
    await executeSQL('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', 'Enable UUID extension');

    // Create users table
    const usersSQL = `
        CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            full_name VARCHAR(255),
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;
    await executeSQL(usersSQL, 'Create users table');

    // Create clients table
    const clientsSQL = `
        CREATE TABLE IF NOT EXISTS public.clients (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            company VARCHAR(255),
            address TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE
        );
    `;
    await executeSQL(clientsSQL, 'Create clients table');

    // Create deals table
    const dealsSQL = `
        CREATE TABLE IF NOT EXISTS public.deals (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            value DECIMAL(10,2),
            status VARCHAR(50) DEFAULT 'open',
            client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;
    await executeSQL(dealsSQL, 'Create deals table');

    // Create tasks table
    const tasksSQL = `
        CREATE TABLE IF NOT EXISTS public.tasks (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            priority VARCHAR(20) DEFAULT 'medium',
            due_date TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
            deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;
    await executeSQL(tasksSQL, 'Create tasks table');

    // Create calendar_events table
    const calendarSQL = `
        CREATE TABLE IF NOT EXISTS public.calendar_events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            location VARCHAR(255),
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;
    await executeSQL(calendarSQL, 'Create calendar_events table');

    // Create journal_entries table
    const journalSQL = `
        CREATE TABLE IF NOT EXISTS public.journal_entries (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            mood VARCHAR(50),
            tags TEXT[],
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;
    await executeSQL(journalSQL, 'Create journal_entries table');

    // Create chat_rooms table
    const chatRoomsSQL = `
        CREATE TABLE IF NOT EXISTS public.chat_rooms (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_private BOOLEAN DEFAULT false,
            created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;
    await executeSQL(chatRoomsSQL, 'Create chat_rooms table');

    // Create chat_messages table
    const chatMessagesSQL = `
        CREATE TABLE IF NOT EXISTS public.chat_messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            content TEXT NOT NULL,
            room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;
    await executeSQL(chatMessagesSQL, 'Create chat_messages table');

    // Create task_groups table
    const taskGroupsSQL = `
        CREATE TABLE IF NOT EXISTS public.task_groups (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            color VARCHAR(7) DEFAULT '#3B82F6',
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;
    await executeSQL(taskGroupsSQL, 'Create task_groups table');

    // Create notifications table
    const notificationsSQL = `
        CREATE TABLE IF NOT EXISTS public.notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            read BOOLEAN DEFAULT false,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `;
    await executeSQL(notificationsSQL, 'Create notifications table');

    // Create indexes
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);', 'Create clients user_id index');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_deals_client_id ON public.deals(client_id);', 'Create deals client_id index');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_deals_user_id ON public.deals(user_id);', 'Create deals user_id index');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);', 'Create tasks user_id index');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);', 'Create tasks status index');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_calendar_events_user_id ON public.calendar_events(user_id);', 'Create calendar_events user_id index');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_calendar_events_start_time ON public.calendar_events(start_time);', 'Create calendar_events start_time index');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON public.journal_entries(user_id);', 'Create journal_entries user_id index');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON public.chat_messages(room_id);', 'Create chat_messages room_id index');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON public.chat_messages(user_id);', 'Create chat_messages user_id index');
    await executeSQL('CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);', 'Create notifications user_id index');

    console.log('\n✅ Schema creation completed!');
}

async function createStorageBucket() {
    try {
        console.log('\n🗂️  Creating storage bucket...');
        
        const { data, error } = await supabase.storage.createBucket('avatars', {
            public: true,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp'],
            fileSizeLimit: 1024 * 1024 * 2 // 2MB
        });

        if (error && !error.message.includes('already exists')) {
            console.log(`⚠️  Storage bucket creation: ${error.message}`);
        } else {
            console.log('✅ Storage bucket "avatars" ready');
        }
    } catch (error) {
        console.log(`⚠️  Storage bucket: ${error.message}`);
    }
}

async function insertInitialData() {
    try {
        console.log('\n📝 Creating initial data...');

        // Create a default chat room
        const { error: roomError } = await supabase
            .from('chat_rooms')
            .insert([
                {
                    name: 'General Discussion',
                    description: 'Main chat room for general discussions',
                    is_private: false
                }
            ]);

        if (roomError && !roomError.message.includes('duplicate')) {
            console.log(`⚠️  Initial chat room: ${roomError.message}`);
        } else {
            console.log('✅ Initial chat room created');
        }

    } catch (error) {
        console.log(`⚠️  Initial data: ${error.message}`);
    }
}

async function verifySchema() {
    console.log('\n🔍 Verifying schema...');
    
    const tables = [
        'users', 'clients', 'deals', 'tasks', 'calendar_events', 
        'journal_entries', 'chat_rooms', 'chat_messages', 
        'task_groups', 'notifications'
    ];

    let allTablesExist = true;

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
                allTablesExist = false;
            } else {
                console.log(`✅ ${table}: Ready`);
            }
        } catch (error) {
            console.log(`❌ ${table}: ${error.message}`);
            allTablesExist = false;
        }
    }

    return allTablesExist;
}

async function main() {
    try {
        await createSchema();
        await createStorageBucket();
        await insertInitialData();
        
        const schemaValid = await verifySchema();
        
        if (schemaValid) {
            console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
            console.log('📊 All tables and storage buckets are ready');
            console.log('🚀 Your CRM application is ready to use!');
        } else {
            console.log('\n⚠️  MIGRATION PARTIALLY COMPLETED');
            console.log('❌ Some tables may not be accessible');
            console.log('💡 Check Supabase dashboard for any issues');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (process.argv[1].endsWith('create-schema-rest.js')) {
    main();
}

export { main as createSchemaRest };