#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkTables() {
    console.log('🔍 Checking existing tables in Supabase project...\n');

    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log(`📡 Connected to: ${process.env.SUPABASE_URL}\n`);

    const tables = ['users', 'clients', 'deals', 'calendar_events', 'tasks', 'journal_entries', 'chat_rooms', 'chat_messages', 'task_groups', 'notifications'];

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log(`❌ ${table}: Table does not exist`);
                } else {
                    console.log(`⚠️  ${table}: ${error.message}`);
                }
            } else {
                console.log(`✅ ${table}: Table exists (${data ? data.length : 0} sample records)`);
            }
        } catch (err) {
            console.log(`❌ ${table}: ${err.message}`);
        }
    }

    console.log('\n🔍 Checking storage buckets...');
    try {
        const { data: buckets, error } = await supabase.storage.listBuckets();
        if (error) {
            console.log(`❌ Storage: ${error.message}`);
        } else {
            console.log(`✅ Storage buckets: ${buckets.map(b => b.name).join(', ') || 'None'}`);
        }
    } catch (err) {
        console.log(`❌ Storage: ${err.message}`);
    }
}

if (process.argv[1] && process.argv[1].endsWith('check-tables.js')) {
    checkTables().catch(console.error);
}

export { checkTables };