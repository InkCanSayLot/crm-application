#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const { Client } = pg;

// Extract connection details from Supabase URL
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    process.exit(1);
}

// Parse Supabase URL to get PostgreSQL connection details
const urlMatch = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
if (!urlMatch) {
    console.error('❌ Invalid Supabase URL format');
    process.exit(1);
}

const projectRef = urlMatch[1];
const connectionString = `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;

async function executeSQL() {
    console.log('🚀 Executing SQL Schema Creation...');
    console.log(`📡 Target: ${supabaseUrl}`);
    console.log('=' .repeat(60));
    
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        console.log('🔌 Connecting to PostgreSQL...');
        await client.connect();
        console.log('✅ Connected to database');
        
        // Read the SQL schema file
        const schemaPath = path.join(__dirname, '..', 'setup-database-schema.sql');
        if (!fs.existsSync(schemaPath)) {
            console.error('❌ Schema file not found:', schemaPath);
            return false;
        }
        
        const sqlContent = fs.readFileSync(schemaPath, 'utf8');
        console.log('📄 Loaded schema SQL file');
        
        // Split SQL into individual statements
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📋 Executing ${statements.length} SQL statements...`);
        
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim().length === 0) continue;
            
            try {
                await client.query(statement);
                successCount++;
                
                // Log progress for major operations
                if (statement.toLowerCase().includes('create table')) {
                    const tableMatch = statement.match(/create table\s+(\w+)/i);
                    if (tableMatch) {
                        console.log(`✅ Created table: ${tableMatch[1]}`);
                    }
                } else if (statement.toLowerCase().includes('create index')) {
                    console.log(`✅ Created index`);
                } else if (statement.toLowerCase().includes('insert into')) {
                    console.log(`✅ Inserted data`);
                }
                
            } catch (error) {
                errorCount++;
                
                // Skip certain expected errors
                if (error.message.includes('already exists') || 
                    error.message.includes('duplicate key') ||
                    error.message.includes('relation') && error.message.includes('already exists')) {
                    console.log(`⚠️  Skipped (already exists): ${error.message.split('\n')[0]}`);
                } else {
                    console.log(`❌ Error in statement ${i + 1}: ${error.message.split('\n')[0]}`);
                }
            }
        }
        
        console.log('\n📊 Execution Summary:');
        console.log(`✅ Successful statements: ${successCount}`);
        console.log(`❌ Failed statements: ${errorCount}`);
        console.log(`📈 Success rate: ${Math.round((successCount / statements.length) * 100)}%`);
        
        // Verify tables were created
        console.log('\n🔍 Verifying created tables...');
        const tablesQuery = `
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `;
        
        const result = await client.query(tablesQuery);
        const tables = result.rows.map(row => row.table_name);
        
        console.log(`📋 Found ${tables.length} tables:`);
        tables.forEach(table => console.log(`  ✅ ${table}`));
        
        const requiredTables = ['users', 'clients', 'tasks', 'calendar_events', 'journal_entries', 'chat_rooms', 'chat_messages', 'task_groups'];
        const missingTables = requiredTables.filter(table => !tables.includes(table));
        
        if (missingTables.length === 0) {
            console.log('\n🎉 All required tables created successfully!');
            return true;
        } else {
            console.log(`\n⚠️  Missing tables: ${missingTables.join(', ')}`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('\n💡 Troubleshooting:');
        console.log('1. Make sure SUPABASE_DB_PASSWORD is set in your .env file');
        console.log('2. Check that your Supabase project allows direct PostgreSQL connections');
        console.log('3. Verify your project reference in the Supabase URL');
        return false;
    } finally {
        await client.end();
        console.log('🔌 Database connection closed');
    }
}

// Run the SQL execution
if (process.argv[1] && process.argv[1].endsWith('execute-sql-direct.js')) {
    executeSQL()
        .then(success => {
            if (success) {
                console.log('\n🎉 Schema creation completed successfully!');
                console.log('🔄 You can now run the complete migration again:');
                console.log('   node scripts/complete-migration.js');
                process.exit(0);
            } else {
                console.log('\n⚠️  Schema creation completed with issues.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Schema creation failed:', error);
            process.exit(1);
        });
}

export { executeSQL };