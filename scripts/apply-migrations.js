#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Essential migrations in order
const ESSENTIAL_MIGRATIONS = [
    '001_initial_schema.sql',
    '20241220_create_avatars_bucket.sql',
    '20241220_add_image_storage.sql',
    '20241220_data_separation_architecture.sql',
    '20241220_fix_permissions_secure.sql',
    '20241221_add_phone_column_and_fix_uuid.sql',
    '20241221_add_remaining_user_columns.sql',
    'add_avatar_url_column.sql',
    'add_mood_column_to_journal_entries.sql',
    'add_title_category_to_journal_entries.sql',
    'create_chat_tables.sql',
    'create_general_chat_room.sql'
];

async function applyMigrations() {
    console.log('🚀 Starting database migration...\n');

    // Initialize Supabase client
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log(`📡 Connected to: ${process.env.SUPABASE_URL}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const migrationFile of ESSENTIAL_MIGRATIONS) {
        try {
            console.log(`📄 Applying: ${migrationFile}`);
            
            const migrationPath = join(__dirname, '..', 'supabase', 'migrations', migrationFile);
            const sql = readFileSync(migrationPath, 'utf8');
            
            // Execute the migration
            const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
            
            if (error) {
                // Try direct query execution if RPC fails
                const { error: directError } = await supabase
                    .from('_migrations')
                    .select('*')
                    .limit(1);
                
                if (directError && directError.code === 'PGRST116') {
                    // Table doesn't exist, execute SQL directly via REST API
                    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
                            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
                        },
                        body: JSON.stringify({ sql_query: sql })
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
                    }
                } else {
                    throw error;
                }
            }
            
            console.log(`✅ Success: ${migrationFile}\n`);
            successCount++;
            
        } catch (error) {
            console.log(`❌ Error in ${migrationFile}:`);
            console.log(`   ${error.message}\n`);
            errorCount++;
            
            // Continue with other migrations even if one fails
            continue;
        }
    }

    console.log('📊 Migration Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📁 Total: ${ESSENTIAL_MIGRATIONS.length}\n`);

    if (errorCount === 0) {
        console.log('🎉 All migrations applied successfully!');
    } else {
        console.log('⚠️  Some migrations failed. Check the errors above.');
    }

    return { successCount, errorCount };
}

// Execute migrations if run directly
if (process.argv[1] && process.argv[1].endsWith('apply-migrations.js')) {
    applyMigrations().catch(console.error);
}

export { applyMigrations };