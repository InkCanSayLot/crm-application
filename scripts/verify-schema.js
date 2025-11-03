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

console.log('🔍 SCHEMA VERIFICATION');
console.log('==================================================');
console.log(`📡 Target: ${supabaseUrl}`);

async function verifyTables() {
    console.log('\n📋 Checking database tables...\n');
    
    const tables = [
        'users', 'clients', 'deals', 'tasks', 'calendar_events', 
        'journal_entries', 'chat_rooms', 'chat_messages', 
        'task_groups', 'notifications'
    ];

    let allTablesExist = true;
    const existingTables = [];
    const missingTables = [];

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`❌ ${table}: ${error.message}`);
                missingTables.push(table);
                allTablesExist = false;
            } else {
                console.log(`✅ ${table}: Ready`);
                existingTables.push(table);
            }
        } catch (error) {
            console.log(`❌ ${table}: ${error.message}`);
            missingTables.push(table);
            allTablesExist = false;
        }
    }

    return { allTablesExist, existingTables, missingTables };
}

async function verifyStorageBuckets() {
    console.log('\n🗂️  Checking storage buckets...\n');
    
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
            console.log(`❌ Storage buckets: ${error.message}`);
            return false;
        }
        
        const avatarsBucket = buckets.find(bucket => bucket.name === 'avatars');
        
        if (avatarsBucket) {
            console.log('✅ avatars: Ready');
            return true;
        } else {
            console.log('❌ avatars: Missing');
            return false;
        }
    } catch (error) {
        console.log(`❌ Storage buckets: ${error.message}`);
        return false;
    }
}

async function testConnection() {
    console.log('\n🔌 Testing database connection...\n');
    
    try {
        // Try to insert a test user
        const { data, error } = await supabase
            .from('users')
            .insert([
                {
                    email: 'test@example.com',
                    full_name: 'Test User'
                }
            ])
            .select();

        if (error) {
            console.log(`❌ Connection test: ${error.message}`);
            return false;
        }

        // Clean up test data
        if (data && data.length > 0) {
            await supabase
                .from('users')
                .delete()
                .eq('id', data[0].id);
        }

        console.log('✅ Connection test: SUCCESS');
        return true;
    } catch (error) {
        console.log(`❌ Connection test: ${error.message}`);
        return false;
    }
}

async function createInitialData() {
    console.log('\n📝 Creating initial data...\n');
    
    try {
        // Create a default chat room
        const { data: existingRoom } = await supabase
            .from('chat_rooms')
            .select('*')
            .eq('name', 'General Discussion')
            .single();

        if (!existingRoom) {
            const { error: roomError } = await supabase
                .from('chat_rooms')
                .insert([
                    {
                        name: 'General Discussion',
                        description: 'Main chat room for general discussions',
                        is_private: false
                    }
                ]);

            if (roomError) {
                console.log(`⚠️  Initial chat room: ${roomError.message}`);
            } else {
                console.log('✅ Initial chat room created');
            }
        } else {
            console.log('✅ Initial chat room already exists');
        }

        return true;
    } catch (error) {
        console.log(`❌ Initial data: ${error.message}`);
        return false;
    }
}

async function main() {
    try {
        const { allTablesExist, existingTables, missingTables } = await verifyTables();
        const bucketsExist = await verifyStorageBuckets();
        
        console.log('\n📊 VERIFICATION SUMMARY');
        console.log('==================================================');
        
        if (allTablesExist && bucketsExist) {
            console.log('🎉 ALL CHECKS PASSED!');
            console.log(`✅ Tables: ${existingTables.length}/10 created`);
            console.log('✅ Storage: avatars bucket ready');
            
            const connectionOk = await testConnection();
            
            if (connectionOk) {
                await createInitialData();
                
                console.log('\n🚀 MIGRATION COMPLETED SUCCESSFULLY!');
                console.log('📊 Your CRM database is ready to use!');
                console.log('');
                console.log('Next steps:');
                console.log('1. 🔄 Run your application: npm run dev');
                console.log('2. 🌐 Test the application functionality');
                console.log('3. 🚀 Deploy to Railway with new environment variables');
            }
        } else {
            console.log('⚠️  SETUP INCOMPLETE');
            
            if (missingTables.length > 0) {
                console.log(`❌ Missing tables: ${missingTables.join(', ')}`);
                console.log('');
                console.log('Please complete the manual setup:');
                console.log('1. 🌐 Open Supabase Dashboard SQL Editor');
                console.log('2. 📋 Run the SQL from setup-database-schema.sql');
                console.log('3. 🔄 Run this verification script again');
            }
            
            if (!bucketsExist) {
                console.log('❌ Missing storage bucket: avatars');
                console.log('💡 This should be created automatically');
            }
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (process.argv[1].endsWith('verify-schema.js')) {
    main();
}

export { main as verifySchema };