import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

console.log('🚀 SIMPLE SCHEMA CREATION');
console.log('==================================================');
console.log(`📡 Target: ${supabaseUrl}`);

async function createTables() {
    console.log('\n📋 Creating database tables using SQL...\n');

    // Since we can't use exec_sql, let's try creating tables through the REST API directly
    const baseUrl = supabaseUrl.replace('/supabase', '');
    
    const sqlStatements = [
        'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";',
        
        `CREATE TABLE IF NOT EXISTS public.users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            full_name VARCHAR(255),
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,
        
        `CREATE TABLE IF NOT EXISTS public.clients (
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
        );`,
        
        `CREATE TABLE IF NOT EXISTS public.deals (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            value DECIMAL(10,2),
            status VARCHAR(50) DEFAULT 'open',
            client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,
        
        `CREATE TABLE IF NOT EXISTS public.tasks (
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
        );`,
        
        `CREATE TABLE IF NOT EXISTS public.calendar_events (
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
        );`,
        
        `CREATE TABLE IF NOT EXISTS public.journal_entries (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            mood VARCHAR(50),
            tags TEXT[],
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,
        
        `CREATE TABLE IF NOT EXISTS public.chat_rooms (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_private BOOLEAN DEFAULT false,
            created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,
        
        `CREATE TABLE IF NOT EXISTS public.chat_messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            content TEXT NOT NULL,
            room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,
        
        `CREATE TABLE IF NOT EXISTS public.task_groups (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            color VARCHAR(7) DEFAULT '#3B82F6',
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`,
        
        `CREATE TABLE IF NOT EXISTS public.notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            read BOOLEAN DEFAULT false,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );`
    ];

    console.log('📝 Manual Schema Setup Required');
    console.log('==================================================');
    console.log('Since automated SQL execution is not available, please:');
    console.log('');
    console.log('1. 🌐 Open your Supabase Dashboard:');
    console.log(`   ${supabaseUrl.replace('/rest/v1', '')}`);
    console.log('');
    console.log('2. 📊 Go to SQL Editor');
    console.log('');
    console.log('3. 📋 Copy and paste this SQL:');
    console.log('');
    console.log('-- Enable UUID extension');
    console.log('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    console.log('');
    
    sqlStatements.slice(1).forEach((sql, index) => {
        console.log(`-- Table ${index + 1}`);
        console.log(sql);
        console.log('');
    });
    
    console.log('4. ▶️  Click "Run" to execute the SQL');
    console.log('');
    console.log('5. 🔄 Come back and run: node scripts/verify-schema.js');
    console.log('');
    console.log('💡 Alternatively, you can use the setup-database-schema.sql file');
    console.log('   which contains the complete schema with indexes and RLS policies.');
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

async function main() {
    try {
        await createStorageBucket();
        await createTables();
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (process.argv[1].endsWith('create-schema-simple.js')) {
    main();
}

export { main as createSchemaSimple };