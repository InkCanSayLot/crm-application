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

async function importData(exportFilePath) {
  console.log('🚀 Starting Supabase data import...');
  
  if (!fs.existsSync(exportFilePath)) {
    throw new Error(`Export file not found: ${exportFilePath}`);
  }

  const exportData = JSON.parse(fs.readFileSync(exportFilePath, 'utf8'));
  
  console.log(`📄 Importing data from: ${exportFilePath}`);
  console.log(`📅 Export timestamp: ${exportData.timestamp}`);
  console.log(`🔗 Source project: ${exportData.source_project}`);
  console.log(`🎯 Target project: ${process.env.SUPABASE_URL}`);

  const importResults = {
    timestamp: new Date().toISOString(),
    source_file: exportFilePath,
    target_project: process.env.SUPABASE_URL,
    results: {}
  };

  // Import order matters due to foreign key constraints
  const importOrder = [
    'users',
    'clients',
    'deals', 
    'calendar_events',
    'task_groups',
    'tasks',
    'journal_entries',
    'chat_rooms',
    'chat_messages',
    'notifications'
  ];

  try {
    for (const table of importOrder) {
      if (!exportData.tables[table] || !exportData.tables[table].data) {
        console.log(`⏭️  Skipping ${table} (no data to import)`);
        continue;
      }

      const tableData = exportData.tables[table].data;
      console.log(`📊 Importing ${tableData.length} records to ${table}...`);

      if (tableData.length === 0) {
        console.log(`⏭️  Skipping ${table} (empty)`);
        importResults.results[table] = { imported: 0, errors: 0 };
        continue;
      }

      let imported = 0;
      let errors = 0;
      const batchSize = 100; // Import in batches to avoid timeouts

      for (let i = 0; i < tableData.length; i += batchSize) {
        const batch = tableData.slice(i, i + batchSize);
        
        try {
          const { data, error } = await supabase
            .from(table)
            .insert(batch)
            .select();

          if (error) {
            console.error(`❌ Error importing batch to ${table}:`, error.message);
            errors += batch.length;
            
            // Try inserting records one by one to identify problematic records
            for (const record of batch) {
              try {
                const { error: singleError } = await supabase
                  .from(table)
                  .insert(record);
                
                if (singleError) {
                  console.error(`❌ Failed to import record in ${table}:`, singleError.message);
                  errors++;
                } else {
                  imported++;
                }
              } catch (singleErr) {
                console.error(`❌ Exception importing single record to ${table}:`, singleErr.message);
                errors++;
              }
            }
          } else {
            imported += batch.length;
            console.log(`✅ Imported batch of ${batch.length} records to ${table}`);
          }
        } catch (batchError) {
          console.error(`❌ Exception importing batch to ${table}:`, batchError.message);
          errors += batch.length;
        }
      }

      importResults.results[table] = { imported, errors };
      console.log(`✅ ${table}: ${imported} imported, ${errors} errors`);
    }

    // Save import results
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFilename = `import-results-${timestamp}.json`;
    const resultsPath = path.join(path.dirname(exportFilePath), resultsFilename);
    
    fs.writeFileSync(resultsPath, JSON.stringify(importResults, null, 2));

    console.log('\n🎉 Import completed!');
    console.log(`📄 Results saved to: ${resultsPath}`);
    
    // Print summary
    console.log('\n📊 Import Summary:');
    let totalImported = 0;
    let totalErrors = 0;
    
    for (const [table, result] of Object.entries(importResults.results)) {
      console.log(`  ${table}: ${result.imported} imported, ${result.errors} errors`);
      totalImported += result.imported;
      totalErrors += result.errors;
    }
    
    console.log(`  Total: ${totalImported} imported, ${totalErrors} errors`);

    if (totalErrors > 0) {
      console.log('\n⚠️  Some records failed to import. Check the logs above for details.');
      console.log('   This is often due to:');
      console.log('   - Foreign key constraints');
      console.log('   - Duplicate primary keys');
      console.log('   - Data type mismatches');
      console.log('   - Missing required fields');
    }

    return importResults;

  } catch (error) {
    console.error('❌ Import failed:', error);
    throw error;
  }
}

// Function to find the latest export file
function findLatestExportFile() {
  const backupDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    throw new Error('Backups directory not found. Please run export first.');
  }

  const files = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('supabase-export-') && file.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error('No export files found. Please run export first.');
  }

  return path.join(backupDir, files[0]);
}

// Run import if called directly
if (process.argv[1] && process.argv[1].endsWith('import-supabase-data.js')) {
  const exportFile = process.argv[2] || findLatestExportFile();
  
  importData(exportFile)
    .then((results) => {
      console.log('\n✅ Data imported successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

export { importData, findLatestExportFile };