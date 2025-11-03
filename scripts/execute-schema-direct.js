import { Client } from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 DIRECT SCHEMA EXECUTION');
console.log('==================================================');

// Extract database connection details from Supabase URL
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file');
    process.exit(1);
}

// Parse Supabase URL to get database connection details
// Format: https://project-ref.supabase.co/rest/v1
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
    console.error('❌ Could not parse project reference from SUPABASE_URL');
    process.exit(1);
}

// Database connection configuration
const dbConfig = {
    host: `db.${projectRef}.supabase.co`,
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD,
    ssl: {
        rejectUnauthorized: false
    }
};

console.log(`📡 Target: ${dbConfig.host}`);
console.log(`🔑 Database: ${dbConfig.database}`);

async function executeSchema() {
    const client = new Client(dbConfig);
    
    try {
        console.log('\n🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully');

        // Read the schema file
        const schemaPath = join(__dirname, '..', 'setup-database-schema.sql');
        console.log(`\n📋 Reading schema from: ${schemaPath}`);
        
        const schemaSQL = readFileSync(schemaPath, 'utf8');
        console.log(`✅ Schema loaded (${schemaSQL.length} characters)`);

        // Split SQL into individual statements
        const statements = schemaSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`\n🔄 Executing ${statements.length} SQL statements...\n`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            try {
                // Skip empty statements
                if (!statement || statement.length < 5) continue;
                
                console.log(`${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
                
                await client.query(statement);
                console.log(`✅ Success`);
                successCount++;
                
            } catch (error) {
                // Some errors are expected (like "already exists")
                if (error.message.includes('already exists') || 
                    error.message.includes('duplicate key') ||
                    error.message.includes('relation') && error.message.includes('already exists')) {
                    console.log(`⚠️  Already exists (OK)`);
                    successCount++;
                } else {
                    console.log(`❌ Error: ${error.message}`);
                    errorCount++;
                }
            }
        }

        console.log(`\n📊 EXECUTION SUMMARY`);
        console.log(`✅ Successful: ${successCount}`);
        console.log(`❌ Errors: ${errorCount}`);

        if (errorCount === 0) {
            console.log('\n🎉 SCHEMA CREATED SUCCESSFULLY!');
        } else {
            console.log('\n⚠️  SCHEMA PARTIALLY CREATED');
            console.log('Some statements failed, but this may be normal');
        }

    } catch (error) {
        console.error(`❌ Database connection failed: ${error.message}`);
        
        if (error.message.includes('password authentication failed')) {
            console.log('\n💡 Database password not found. Please:');
            console.log('1. 🌐 Go to your Supabase Dashboard');
            console.log('2. ⚙️  Go to Settings > Database');
            console.log('3. 🔑 Copy the database password');
            console.log('4. 📝 Add it to your .env file as SUPABASE_DB_PASSWORD=your_password');
            console.log('5. 🔄 Run this script again');
        }
        
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

async function verifyTables() {
    console.log('\n🔍 Verifying created tables...');
    
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const tables = [
        'users', 'clients', 'tasks', 'calendar_events', 
        'journal_entries', 'chat_rooms', 'chat_messages', 'task_groups'
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
        await executeSchema();
        
        // Wait a moment for schema to be available
        console.log('\n⏳ Waiting for schema to be available...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const tablesReady = await verifyTables();
        
        if (tablesReady) {
            console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
            console.log('📊 All tables are ready');
            console.log('🚀 Your CRM application should now work correctly!');
            
            console.log('\n📋 Next steps:');
            console.log('1. 🔄 Refresh your application');
            console.log('2. 🧪 Test all features');
            console.log('3. 🚀 Deploy to Railway');
        } else {
            console.log('\n⚠️  VERIFICATION FAILED');
            console.log('Some tables may not be accessible yet');
            console.log('💡 Try refreshing your application in a few minutes');
        }
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (process.argv[1].endsWith('execute-schema-direct.js')) {
    main();
}

export { main as executeSchemaDirectly };