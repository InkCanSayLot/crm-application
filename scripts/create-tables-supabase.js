import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 CREATING TABLES USING SUPABASE CLIENT');
console.log('========================================');

// Read environment variables
const envPath = path.join(__dirname, '..', '.env');
let supabaseUrl = '';
let serviceKey = '';

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
        if (line.startsWith('SUPABASE_URL=') || line.startsWith('VITE_SUPABASE_URL=')) {
            supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
        }
        if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
            serviceKey = line.split('=')[1].trim().replace(/['"]/g, '');
        }
    }
}

if (!supabaseUrl || !serviceKey) {
    console.log('❌ Missing Supabase credentials');
    console.log(`URL: ${supabaseUrl ? 'Found' : 'Missing'}`);
    console.log(`Key: ${serviceKey ? 'Found' : 'Missing'}`);
    process.exit(1);
}

console.log(`📡 Target: ${supabaseUrl}`);

// Initialize Supabase client
const supabase = createClient(supabaseUrl, serviceKey);

async function testConnection() {
    try {
        console.log('🔍 Testing connection...');
        
        // Test with storage buckets instead
        const { data, error } = await supabase.storage.listBuckets();
        
        if (error) {
            console.log(`❌ Connection error: ${error.message}`);
            return false;
        } else {
            console.log('✅ Connection successful');
            return true;
        }
    } catch (error) {
        console.log(`❌ Connection failed: ${error.message}`);
        return false;
    }
}

async function createStorageBucket() {
    try {
        console.log('🗂️  Creating storage bucket...');
        
        // Check if bucket exists
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
            console.log(`❌ Could not list buckets: ${listError.message}`);
            return false;
        }
        
        const avatarsBucket = buckets.find(b => b.name === 'avatars');
        
        if (avatarsBucket) {
            console.log('✅ Avatars bucket already exists');
            return true;
        }
        
        const { error } = await supabase.storage.createBucket('avatars', {
            public: true
        });
        
        if (error) {
            console.log(`❌ Could not create bucket: ${error.message}`);
            return false;
        }
        
        console.log('✅ Avatars bucket created');
        return true;
        
    } catch (error) {
        console.log(`❌ Storage error: ${error.message}`);
        return false;
    }
}

async function executeRawSQL() {
    console.log('📋 Attempting to execute raw SQL...');
    
    // Try using rpc with different function names
    const sqlStatements = [
        'CREATE EXTENSION IF NOT EXISTS "uuid-ossp"',
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
        )`
    ];
    
    for (const sql of sqlStatements) {
        try {
            // Try different RPC function names
            const rpcNames = ['exec_sql', 'execute_sql', 'sql', 'query'];
            
            let success = false;
            for (const rpcName of rpcNames) {
                try {
                    const { data, error } = await supabase.rpc(rpcName, { sql });
                    if (!error) {
                        console.log(`✅ SQL executed via ${rpcName}`);
                        success = true;
                        break;
                    }
                } catch (e) {
                    // Try next function name
                    continue;
                }
            }
            
            if (!success) {
                console.log(`⚠️  Could not execute SQL: ${sql.substring(0, 50)}...`);
            }
            
        } catch (error) {
            console.log(`⚠️  SQL execution failed: ${error.message}`);
        }
    }
}

async function createManualInstructions() {
    console.log('');
    console.log('📋 MANUAL SETUP REQUIRED');
    console.log('========================');
    console.log('');
    console.log('Since automated SQL execution is not available, please:');
    console.log('');
    console.log('1. 🌐 Open your Supabase Dashboard:');
    console.log(`   https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].split('//')[1]}/sql`);
    console.log('');
    console.log('2. 📋 Copy and paste this SQL:');
    console.log('');
    
    const schemaPath = path.join(__dirname, '..', 'setup-database-schema.sql');
    const sqlContent = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('--- START SQL ---');
    console.log(sqlContent);
    console.log('--- END SQL ---');
    console.log('');
    console.log('3. ▶️  Click "Run" to execute');
    console.log('4. 🔄 Run: node scripts/check-tables.js to verify');
    console.log('');
    
    // Auto-open dashboard
    const { exec } = await import('child_process');
    const dashboardUrl = `https://supabase.com/dashboard/project/${supabaseUrl.split('.')[0].split('//')[1]}/sql`;
    
    exec(`start "" "${dashboardUrl}"`, (error) => {
        if (!error) {
            console.log('🌐 Supabase Dashboard opened in browser');
        }
    });
}

async function main() {
    try {
        // Test connection
        const connected = await testConnection();
        if (!connected) {
            console.log('❌ Could not connect to Supabase');
            return;
        }
        
        // Create storage bucket
        await createStorageBucket();
        
        // Try to execute SQL
        await executeRawSQL();
        
        // Provide manual instructions
        await createManualInstructions();
        
    } catch (error) {
        console.log(`❌ Setup failed: ${error.message}`);
    }
}

main();