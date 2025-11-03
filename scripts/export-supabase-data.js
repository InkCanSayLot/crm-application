import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exportAllData() {
  console.log('🚀 Starting Supabase data export...');
  
  const exportData = {
    timestamp: new Date().toISOString(),
    source_project: process.env.SUPABASE_URL,
    tables: {}
  };

  // List of tables to export
  const tables = [
    'users',
    'clients', 
    'deals',
    'calendar_events',
    'tasks',
    'task_groups',
    'journal_entries',
    'chat_rooms',
    'chat_messages',
    'notifications'
  ];

  try {
    for (const table of tables) {
      console.log(`📊 Exporting ${table}...`);
      
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.warn(`⚠️  Warning: Could not export ${table}:`, error.message);
        exportData.tables[table] = {
          error: error.message,
          data: []
        };
      } else {
        exportData.tables[table] = {
          count: data.length,
          data: data
        };
        console.log(`✅ Exported ${data.length} records from ${table}`);
      }
    }

    // Export storage bucket information
    console.log('📁 Checking storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (!bucketsError && buckets) {
      exportData.storage = {
        buckets: buckets
      };
      
      // For each bucket, list files
      for (const bucket of buckets) {
        console.log(`📂 Listing files in bucket: ${bucket.name}`);
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 1000 });
        
        if (!filesError && files) {
          exportData.storage[bucket.name] = files;
          console.log(`✅ Found ${files.length} files in ${bucket.name}`);
        }
      }
    }

    // Create backup directory if it doesn't exist
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Save export data
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `supabase-export-${timestamp}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));
    
    console.log('\n🎉 Export completed successfully!');
    console.log(`📄 Export file: ${filepath}`);
    
    // Print summary
    console.log('\n📊 Export Summary:');
    let totalRecords = 0;
    for (const [table, info] of Object.entries(exportData.tables)) {
      if (info.data) {
        console.log(`  ${table}: ${info.count} records`);
        totalRecords += info.count;
      }
    }
    console.log(`  Total records: ${totalRecords}`);
    
    if (exportData.storage && exportData.storage.buckets) {
      console.log(`  Storage buckets: ${exportData.storage.buckets.length}`);
    }

    return filepath;

  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}

// Run export if called directly
if (process.argv[1] && process.argv[1].endsWith('export-supabase-data.js')) {
  exportAllData()
    .then((filepath) => {
      console.log(`\n✅ Data exported successfully to: ${filepath}`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Export failed:', error);
      process.exit(1);
    });
}

export { exportAllData };