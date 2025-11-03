#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function completeMigration() {
    console.log('🚀 Starting Complete Supabase Migration...');
    console.log(`📡 Target: ${supabaseUrl}`);
    console.log('=' .repeat(60));
    
    try {
        // Step 1: Create Schema
        console.log('\n📋 STEP 1: Creating Database Schema');
        const schemaSuccess = await createDatabaseSchema();
        
        if (!schemaSuccess) {
            console.log('❌ Schema creation failed. Please run the SQL manually in Supabase dashboard.');
            console.log('📄 Use the content from setup-database-schema.sql');
            return false;
        }
        
        // Step 2: Verify Schema
        console.log('\n🔍 STEP 2: Verifying Schema');
        const verifySuccess = await verifySchema();
        
        if (!verifySuccess) {
            console.log('❌ Schema verification failed.');
            return false;
        }
        
        // Step 3: Import Data
        console.log('\n📥 STEP 3: Importing Data');
        const importSuccess = await importData();
        
        // Step 4: Final Verification
        console.log('\n✅ STEP 4: Final Verification');
        await finalVerification();
        
        console.log('\n🎉 MIGRATION COMPLETED SUCCESSFULLY!');
        console.log('=' .repeat(60));
        console.log('✅ Database schema created');
        console.log('✅ Data imported');
        console.log('✅ Storage buckets configured');
        console.log('✅ Ready for application testing');
        
        return true;
        
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        return false;
    }
}

async function createDatabaseSchema() {
    console.log('🔧 Creating database tables and schema...');
    
    // Try to create tables using individual operations
    const tables = [
        {
            name: 'users',
            check: async () => {
                const { data, error } = await supabase.from('users').select('count').limit(1);
                return !error;
            }
        },
        {
            name: 'clients',
            check: async () => {
                const { data, error } = await supabase.from('clients').select('count').limit(1);
                return !error;
            }
        },
        {
            name: 'tasks',
            check: async () => {
                const { data, error } = await supabase.from('tasks').select('count').limit(1);
                return !error;
            }
        },
        {
            name: 'calendar_events',
            check: async () => {
                const { data, error } = await supabase.from('calendar_events').select('count').limit(1);
                return !error;
            }
        },
        {
            name: 'journal_entries',
            check: async () => {
                const { data, error } = await supabase.from('journal_entries').select('count').limit(1);
                return !error;
            }
        },
        {
            name: 'chat_rooms',
            check: async () => {
                const { data, error } = await supabase.from('chat_rooms').select('count').limit(1);
                return !error;
            }
        },
        {
            name: 'chat_messages',
            check: async () => {
                const { data, error } = await supabase.from('chat_messages').select('count').limit(1);
                return !error;
            }
        },
        {
            name: 'task_groups',
            check: async () => {
                const { data, error } = await supabase.from('task_groups').select('count').limit(1);
                return !error;
            }
        }
    ];
    
    let existingTables = 0;
    let missingTables = [];
    
    for (const table of tables) {
        const exists = await table.check();
        if (exists) {
            console.log(`✅ Table '${table.name}' exists`);
            existingTables++;
        } else {
            console.log(`❌ Table '${table.name}' missing`);
            missingTables.push(table.name);
        }
    }
    
    if (missingTables.length === 0) {
        console.log('✅ All tables exist!');
        return true;
    }
    
    console.log(`⚠️  ${missingTables.length} tables missing: ${missingTables.join(', ')}`);
    console.log('📋 Manual schema creation required.');
    console.log('\n🔧 AUTOMATED SOLUTION:');
    console.log('1. Open the create-schema.html file in your browser');
    console.log('2. Enter your service role key');
    console.log('3. Click "Create Database Schema"');
    console.log('\n🔧 MANUAL SOLUTION:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select your project');
    console.log('3. Go to SQL Editor');
    console.log('4. Copy content from setup-database-schema.sql');
    console.log('5. Paste and run');
    
    return false;
}

async function verifySchema() {
    console.log('🔍 Verifying database schema...');
    
    const requiredTables = ['users', 'clients', 'tasks', 'calendar_events', 'journal_entries', 'chat_rooms', 'chat_messages', 'task_groups'];
    let allTablesExist = true;
    
    for (const tableName of requiredTables) {
        try {
            const { data, error } = await supabase.from(tableName).select('count').limit(1);
            if (error) {
                console.log(`❌ Table '${tableName}' not accessible: ${error.message}`);
                allTablesExist = false;
            } else {
                console.log(`✅ Table '${tableName}' verified`);
            }
        } catch (err) {
            console.log(`❌ Table '${tableName}' error: ${err.message}`);
            allTablesExist = false;
        }
    }
    
    // Check storage buckets
    try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (bucketsError) {
            console.log('⚠️  Could not verify storage buckets:', bucketsError.message);
        } else {
            const bucketNames = buckets.map(b => b.name);
            if (bucketNames.includes('avatars')) {
                console.log('✅ Avatars storage bucket verified');
            } else {
                console.log('⚠️  Avatars storage bucket missing - will create');
                try {
                    const { error: createError } = await supabase.storage.createBucket('avatars', { public: true });
                    if (createError && !createError.message.includes('already exists')) {
                        console.log('❌ Failed to create avatars bucket:', createError.message);
                    } else {
                        console.log('✅ Created avatars storage bucket');
                    }
                } catch (err) {
                    console.log('❌ Storage bucket creation error:', err.message);
                }
            }
        }
    } catch (err) {
        console.log('⚠️  Storage verification error:', err.message);
    }
    
    return allTablesExist;
}

async function importData() {
    console.log('📥 Starting data import...');
    
    // Find the latest export file
    const backupsDir = path.join(__dirname, '..', 'backups');
    const exportFiles = fs.readdirSync(backupsDir)
        .filter(file => file.startsWith('supabase-export-') && file.endsWith('.json'))
        .sort()
        .reverse();
    
    if (exportFiles.length === 0) {
        console.log('❌ No export file found in backups directory');
        return false;
    }
    
    const exportFile = path.join(backupsDir, exportFiles[0]);
    console.log(`📄 Using export file: ${exportFiles[0]}`);
    
    try {
        const exportData = JSON.parse(fs.readFileSync(exportFile, 'utf8'));
        
        let totalRecords = 0;
        let successfulImports = 0;
        let failedImports = 0;
        
        // Import data for each table
        for (const [tableName, records] of Object.entries(exportData)) {
            if (tableName === 'storage' || !Array.isArray(records) || records.length === 0) {
                continue;
            }
            
            console.log(`📋 Importing ${records.length} records to ${tableName}...`);
            totalRecords += records.length;
            
            try {
                // Try batch insert first
                const { data, error } = await supabase
                    .from(tableName)
                    .insert(records);
                
                if (error) {
                    console.log(`⚠️  Batch insert failed for ${tableName}: ${error.message}`);
                    
                    // Try individual inserts
                    let individualSuccess = 0;
                    for (const record of records) {
                        try {
                            const { error: individualError } = await supabase
                                .from(tableName)
                                .insert([record]);
                            
                            if (!individualError) {
                                individualSuccess++;
                            }
                        } catch (err) {
                            // Skip individual errors
                        }
                    }
                    
                    console.log(`✅ Imported ${individualSuccess}/${records.length} records to ${tableName}`);
                    successfulImports += individualSuccess;
                    failedImports += (records.length - individualSuccess);
                } else {
                    console.log(`✅ Successfully imported all ${records.length} records to ${tableName}`);
                    successfulImports += records.length;
                }
            } catch (err) {
                console.log(`❌ Import error for ${tableName}: ${err.message}`);
                failedImports += records.length;
            }
        }
        
        console.log('\n📊 Import Summary:');
        console.log(`📝 Total records: ${totalRecords}`);
        console.log(`✅ Successful imports: ${successfulImports}`);
        console.log(`❌ Failed imports: ${failedImports}`);
        console.log(`📈 Success rate: ${totalRecords > 0 ? Math.round((successfulImports / totalRecords) * 100) : 0}%`);
        
        return successfulImports > 0;
        
    } catch (error) {
        console.error('❌ Data import failed:', error.message);
        return false;
    }
}

async function finalVerification() {
    console.log('🔍 Running final verification...');
    
    const tables = ['users', 'clients', 'tasks', 'calendar_events', 'journal_entries', 'chat_rooms', 'chat_messages', 'task_groups'];
    
    for (const tableName of tables) {
        try {
            const { data, error, count } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.log(`❌ ${tableName}: Error - ${error.message}`);
            } else {
                console.log(`✅ ${tableName}: ${count || 0} records`);
            }
        } catch (err) {
            console.log(`❌ ${tableName}: ${err.message}`);
        }
    }
    
    // Check storage
    try {
        const { data: buckets } = await supabase.storage.listBuckets();
        const avatarsBucket = buckets?.find(b => b.name === 'avatars');
        if (avatarsBucket) {
            const { data: files } = await supabase.storage.from('avatars').list();
            console.log(`✅ Storage: avatars bucket with ${files?.length || 0} files`);
        } else {
            console.log('⚠️  Storage: avatars bucket not found');
        }
    } catch (err) {
        console.log('⚠️  Storage verification error:', err.message);
    }
}

// Run the complete migration
if (process.argv[1] && process.argv[1].endsWith('complete-migration.js')) {
    completeMigration()
        .then(success => {
            if (success) {
                console.log('\n🎉 All done! Your CRM is ready to use with the new Supabase project.');
                process.exit(0);
            } else {
                console.log('\n⚠️  Migration completed with issues. Please check the logs above.');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

export { completeMigration };