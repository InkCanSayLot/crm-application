import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🎯 FINAL CRM DATABASE SETUP');
console.log('============================');
console.log('');

// Read the SQL schema
const schemaPath = path.join(__dirname, '..', 'setup-database-schema.sql');
const sqlContent = fs.readFileSync(schemaPath, 'utf8');

console.log('📋 MANUAL SETUP INSTRUCTIONS:');
console.log('');
console.log('1. 🌐 I will open your Supabase Dashboard SQL Editor');
console.log('2. 📝 Copy the SQL below and paste it into the SQL Editor');
console.log('3. ▶️  Click "Run" to execute the SQL');
console.log('4. 🔄 Come back here and press Enter to verify');
console.log('');
console.log('🔗 Opening Supabase Dashboard...');

// Open Supabase dashboard
const dashboardUrl = 'https://supabase.com/dashboard/project/kifvxrjpvkoilzxuehci/sql';
exec(`start "" "${dashboardUrl}"`, (error) => {
    if (error) {
        console.log('❌ Could not auto-open dashboard. Please go to:');
        console.log(`   ${dashboardUrl}`);
    } else {
        console.log('✅ Supabase SQL Editor opened');
    }
    
    console.log('');
    console.log('📋 SQL TO COPY AND PASTE:');
    console.log('========================');
    console.log('');
    console.log(sqlContent);
    console.log('');
    console.log('========================');
    console.log('');
    console.log('⚠️  IMPORTANT: Copy ALL the SQL above and paste it into the Supabase SQL Editor');
    console.log('');
    console.log('✅ After running the SQL, press Enter here to verify...');
    
    // Wait for user input
    process.stdin.once('data', async () => {
        console.log('');
        console.log('🔍 Verifying database setup...');
        
        // Run verification
        exec('node scripts/check-tables.js', (error, stdout, stderr) => {
            console.log(stdout);
            if (stderr) console.log(stderr);
            
            if (stdout.includes('✅') && !stdout.includes('⚠️')) {
                console.log('');
                console.log('🎉 SUCCESS! Database setup complete!');
                console.log('');
                console.log('📋 NEXT STEPS:');
                console.log('1. 🚀 Start your application: npm run dev');
                console.log('2. 🌐 Test the CRM functionality');
                console.log('3. 🚀 Deploy to Railway when ready');
            } else {
                console.log('');
                console.log('⚠️  Some tables may still be missing.');
                console.log('Please check the SQL execution in Supabase Dashboard.');
                console.log('Make sure all SQL statements ran without errors.');
            }
            
            process.exit(0);
        });
    });
});

console.log('');
console.log('💡 TIP: The SQL includes:');
console.log('   - All table definitions (users, clients, tasks, etc.)');
console.log('   - Indexes for performance');
console.log('   - Row Level Security policies');
console.log('   - Storage bucket setup');
console.log('   - Initial data');