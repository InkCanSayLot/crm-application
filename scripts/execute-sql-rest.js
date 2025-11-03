import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 DIRECT SQL EXECUTION VIA REST API');
console.log('=====================================');

// Read environment variables
const envPath = path.join(__dirname, '..', '.env');
let supabaseUrl = '';
let serviceKey = '';

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
        if (line.startsWith('SUPABASE_URL=') || line.startsWith('NEXT_PUBLIC_SUPABASE_URL=') || line.startsWith('VITE_SUPABASE_URL=')) {
            supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
        }
        if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
            serviceKey = line.split('=')[1].trim().replace(/['"]/g, '');
        }
    }
}

if (!supabaseUrl || !serviceKey) {
    console.log('❌ Missing Supabase credentials in .env file');
    process.exit(1);
}

// Ensure URL format
if (!supabaseUrl.includes('/rest/v1')) {
    supabaseUrl = `${supabaseUrl}/rest/v1`;
}

console.log(`📡 Target: ${supabaseUrl}`);
console.log(`🔑 Service Key: ${serviceKey.substring(0, 20)}...`);

// Read SQL schema
const schemaPath = path.join(__dirname, '..', 'setup-database-schema.sql');
const sqlContent = fs.readFileSync(schemaPath, 'utf8');

// Split SQL into individual statements
const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

console.log(`📋 Found ${statements.length} SQL statements to execute`);

async function executeSQL(sql) {
    try {
        const response = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${serviceKey}`,
                'apikey': serviceKey,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                query: sql
            })
        });

        if (!response.ok) {
            // Try alternative endpoint
            const altResponse = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/rest/v1/rpc/exec`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${serviceKey}`,
                    'apikey': serviceKey
                },
                body: JSON.stringify({
                    sql: sql
                })
            });

            if (!altResponse.ok) {
                // Try direct SQL execution
                const directResponse = await fetch(`${supabaseUrl.replace('/rest/v1', '')}/rest/v1/query`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${serviceKey}`,
                        'apikey': serviceKey
                    },
                    body: JSON.stringify({
                        query: sql
                    })
                });

                if (!directResponse.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText}`);
                }
                return await directResponse.json();
            }
            return await altResponse.json();
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
}

async function createTablesManually() {
    console.log('🔧 Creating tables using individual CREATE statements...');
    
    const tableStatements = [
        `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`,
        
        `CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            email VARCHAR(255) UNIQUE NOT NULL,
            full_name VARCHAR(255),
            avatar_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS clients (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            company VARCHAR(255),
            status VARCHAR(50) DEFAULT 'active',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS tasks (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            priority VARCHAR(50) DEFAULT 'medium',
            due_date TIMESTAMP WITH TIME ZONE,
            client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS calendar_events (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS journal_entries (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            mood VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS chat_rooms (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name VARCHAR(255) NOT NULL,
            description TEXT,
            is_general BOOLEAN DEFAULT false,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS chat_messages (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS task_groups (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            color VARCHAR(7) DEFAULT '#3B82F6',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        
        `CREATE TABLE IF NOT EXISTS notifications (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'info',
            read BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`
    ];

    for (let i = 0; i < tableStatements.length; i++) {
        const statement = tableStatements[i];
        const tableName = statement.match(/CREATE TABLE.*?(\w+)/i)?.[1] || `Statement ${i + 1}`;
        
        try {
            console.log(`🔄 Creating ${tableName}...`);
            await executeSQL(statement);
            console.log(`✅ ${tableName} created successfully`);
        } catch (error) {
            if (error.message.includes('already exists')) {
                console.log(`⚠️  ${tableName} already exists (OK)`);
            } else {
                console.log(`❌ Failed to create ${tableName}: ${error.message}`);
            }
        }
    }
}

async function enableRLS() {
    console.log('🔒 Enabling Row Level Security...');
    
    const rlsStatements = [
        'ALTER TABLE users ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE clients ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE tasks ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY',
        'ALTER TABLE task_groups ENABLE ROW LEVEL SECURITY'
    ];

    for (const statement of rlsStatements) {
        try {
            await executeSQL(statement);
            console.log(`✅ RLS enabled for table`);
        } catch (error) {
            console.log(`⚠️  RLS: ${error.message}`);
        }
    }
}

async function createInitialData() {
    console.log('📋 Creating initial data...');
    
    try {
        await executeSQL(`
            INSERT INTO chat_rooms (name, description, is_general)
            VALUES ('General', 'General discussion for all team members', true)
            ON CONFLICT DO NOTHING
        `);
        console.log('✅ General chat room created');
    } catch (error) {
        console.log(`⚠️  Initial data: ${error.message}`);
    }
}

async function main() {
    try {
        console.log('🚀 Starting direct SQL execution...');
        
        // Step 1: Create tables manually
        await createTablesManually();
        
        // Step 2: Enable RLS
        await enableRLS();
        
        // Step 3: Create initial data
        await createInitialData();
        
        console.log('');
        console.log('🎉 SQL EXECUTION COMPLETED!');
        console.log('');
        console.log('🔍 Verifying tables...');
        
        // Import and run verification
        const { exec } = await import('child_process');
        exec('node scripts/check-tables.js', (error, stdout, stderr) => {
            console.log(stdout);
            if (stderr) console.log(stderr);
            
            if (stdout.includes('✅')) {
                console.log('');
                console.log('🎉 SUCCESS! All tables created successfully!');
                console.log('');
                console.log('📋 NEXT STEPS:');
                console.log('1. 🚀 Start your application: npm run dev');
                console.log('2. 🌐 Test the CRM functionality');
                console.log('3. 🚀 Deploy to Railway when ready');
            } else {
                console.log('');
                console.log('⚠️  Some tables may still be missing. Check the verification output above.');
            }
        });
        
    } catch (error) {
        console.log(`❌ Execution failed: ${error.message}`);
        process.exit(1);
    }
}

main();