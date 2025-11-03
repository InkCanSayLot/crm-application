import { exportAllData } from './export-supabase-data.js';
import { importData } from './import-supabase-data.js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function updateEnvFile(newCredentials) {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env file not found');
    return false;
  }

  // Backup current .env file
  const backupPath = path.join(__dirname, '..', 'backups', `.env.backup.${Date.now()}`);
  fs.copyFileSync(envPath, backupPath);
  console.log(`📄 Backed up current .env to: ${backupPath}`);

  // Read current .env file
  let envContent = fs.readFileSync(envPath, 'utf8');

  // Update Supabase credentials
  envContent = envContent.replace(
    /SUPABASE_URL=.*/,
    `SUPABASE_URL=${newCredentials.url}`
  );
  envContent = envContent.replace(
    /SUPABASE_ANON_KEY=.*/,
    `SUPABASE_ANON_KEY=${newCredentials.anonKey}`
  );
  envContent = envContent.replace(
    /SUPABASE_SERVICE_ROLE_KEY=.*/,
    `SUPABASE_SERVICE_ROLE_KEY=${newCredentials.serviceRoleKey}`
  );
  envContent = envContent.replace(
    /VITE_SUPABASE_URL=.*/,
    `VITE_SUPABASE_URL=${newCredentials.url}`
  );
  envContent = envContent.replace(
    /VITE_SUPABASE_ANON_KEY=.*/,
    `VITE_SUPABASE_ANON_KEY=${newCredentials.anonKey}`
  );

  // Write updated .env file
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Updated .env file with new Supabase credentials');
  
  return true;
}

async function runMigration() {
  console.log('🚀 Supabase Account Migration Tool');
  console.log('=====================================\n');

  try {
    // Step 1: Confirm migration
    console.log('⚠️  IMPORTANT: This will migrate your CRM data to a new Supabase account.');
    console.log('   Make sure you have:');
    console.log('   1. Created a new Supabase account with your desired email');
    console.log('   2. Created a new project in that account');
    console.log('   3. Applied all database migrations to the new project');
    console.log('   4. Set up storage buckets in the new project\n');

    const confirm = await question('Do you want to continue? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Migration cancelled');
      process.exit(0);
    }

    // Step 2: Get new Supabase credentials
    console.log('\n📝 Please provide your new Supabase project credentials:');
    
    const newUrl = await question('New Supabase URL (e.g., https://your-project.supabase.co): ');
    const newAnonKey = await question('New Anon Key: ');
    const newServiceRoleKey = await question('New Service Role Key: ');

    if (!newUrl || !newAnonKey || !newServiceRoleKey) {
      console.log('❌ All credentials are required');
      process.exit(1);
    }

    const newCredentials = {
      url: newUrl.trim(),
      anonKey: newAnonKey.trim(),
      serviceRoleKey: newServiceRoleKey.trim()
    };

    // Step 3: Export current data
    console.log('\n📊 Step 1: Exporting current data...');
    const exportFilePath = await exportAllData();
    console.log(`✅ Data exported to: ${exportFilePath}`);

    // Step 4: Update environment variables
    console.log('\n🔧 Step 2: Updating environment variables...');
    const envUpdated = await updateEnvFile(newCredentials);
    
    if (!envUpdated) {
      console.log('❌ Failed to update .env file');
      process.exit(1);
    }

    // Step 5: Test connection to new project
    console.log('\n🔗 Step 3: Testing connection to new Supabase project...');
    
    // Reload environment variables
    dotenv.config();
    
    const { createClient } = await import('@supabase/supabase-js');
    const newSupabase = createClient(newCredentials.url, newCredentials.serviceRoleKey);
    
    try {
      const { data, error } = await newSupabase.from('users').select('count').limit(1);
      if (error && !error.message.includes('relation "users" does not exist')) {
        throw error;
      }
      console.log('✅ Connection to new Supabase project successful');
    } catch (connectionError) {
      console.error('❌ Failed to connect to new Supabase project:', connectionError.message);
      console.log('\n🔄 Rolling back environment variables...');
      
      // Restore backup
      const backupFiles = fs.readdirSync(path.join(__dirname, '..', 'backups'))
        .filter(f => f.startsWith('.env.backup.'))
        .sort()
        .reverse();
      
      if (backupFiles.length > 0) {
        const latestBackup = path.join(__dirname, '..', 'backups', backupFiles[0]);
        fs.copyFileSync(latestBackup, path.join(__dirname, '..', '.env'));
        console.log('✅ Environment variables restored from backup');
      }
      
      process.exit(1);
    }

    // Step 6: Import data to new project
    console.log('\n📥 Step 4: Importing data to new Supabase project...');
    
    const importResults = await importData(exportFilePath);
    
    // Step 7: Verify migration
    console.log('\n✅ Step 5: Verifying migration...');
    
    let totalImported = 0;
    let totalErrors = 0;
    
    for (const [table, result] of Object.entries(importResults.results)) {
      totalImported += result.imported;
      totalErrors += result.errors;
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('=====================================');
    console.log(`📊 Total records imported: ${totalImported}`);
    console.log(`❌ Total errors: ${totalErrors}`);
    console.log(`📄 Export file: ${exportFilePath}`);
    console.log(`🔗 New Supabase URL: ${newCredentials.url}`);

    if (totalErrors > 0) {
      console.log('\n⚠️  Some records failed to import. This is usually normal due to:');
      console.log('   - Duplicate data that already exists');
      console.log('   - Foreign key constraints');
      console.log('   - Schema differences');
      console.log('\n   Please test your application to ensure everything works correctly.');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. Test your local application: npm run dev');
    console.log('2. Update Railway environment variables with new credentials');
    console.log('3. Redeploy your Railway application');
    console.log('4. Test the production application');
    console.log('5. Keep the old Supabase project as backup for a few days');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n🔄 If you need to rollback:');
    console.log('1. Restore .env from backup in the backups/ folder');
    console.log('2. Your original Supabase project is still intact');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}

export { runMigration, updateEnvFile };