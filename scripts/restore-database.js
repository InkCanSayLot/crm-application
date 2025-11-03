#!/usr/bin/env node

/**
 * Automated Supabase Database Restore Script
 * 
 * This script restores data from backup files created by backup-database.js
 * with proper error handling, logging, and verification.
 * 
 * Usage:
 *   node scripts/restore-database.js <backup-file>
 *   npm run db:restore <backup-file>
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  backupDir: path.join(__dirname, '..', 'backups'),
  batchSize: 100 // Insert records in batches
};

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey);

/**
 * Logger utility
 */
const logger = {
  info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
  error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
  success: (msg) => console.log(`[SUCCESS] ${new Date().toISOString()} - ${msg}`),
  warn: (msg) => console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`)
};

/**
 * Ask for user confirmation
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase().startsWith('y'));
    });
  });
}

/**
 * Test database connectivity
 */
async function testConnection() {
  try {
    logger.info('Testing database connection...');
    const { data, error } = await supabase.from('clients').select('count', { count: 'exact', head: true });
    
    if (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
    
    logger.success('Database connection successful');
    return true;
  } catch (error) {
    logger.error(`Database connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Load and validate backup file
 */
function loadBackupFile(backupFilePath) {
  try {
    logger.info(`Loading backup file: ${backupFilePath}`);
    
    if (!fs.existsSync(backupFilePath)) {
      throw new Error('Backup file does not exist');
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    
    // Validate backup structure
    if (!backupData.metadata || !backupData.data || !backupData.recordCounts) {
      throw new Error('Invalid backup file structure');
    }
    
    logger.success(`Backup file loaded successfully`);
    logger.info(`Backup timestamp: ${backupData.metadata.timestamp}`);
    logger.info(`Tables in backup: ${Object.keys(backupData.data).join(', ')}`);
    
    return backupData;
  } catch (error) {
    logger.error(`Failed to load backup file: ${error.message}`);
    throw error;
  }
}

/**
 * Get current record counts
 */
async function getCurrentRecordCounts(tables) {
  const counts = {};
  
  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        logger.warn(`Could not count records in ${table}: ${error.message}`);
        counts[table] = 'unknown';
      } else {
        counts[table] = count;
      }
    } catch (error) {
      logger.warn(`Error counting ${table}: ${error.message}`);
      counts[table] = 'error';
    }
  }
  
  return counts;
}

/**
 * Clear table data (with confirmation)
 */
async function clearTable(tableName, confirm = true) {
  try {
    if (confirm) {
      const shouldClear = await askConfirmation(
        `⚠️  This will DELETE ALL data in table '${tableName}'. Continue? (y/N): `
      );
      
      if (!shouldClear) {
        logger.info(`Skipping table ${tableName}`);
        return false;
      }
    }
    
    logger.info(`Clearing table: ${tableName}`);
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (error) {
      throw new Error(`Failed to clear ${tableName}: ${error.message}`);
    }
    
    logger.success(`Table ${tableName} cleared successfully`);
    return true;
  } catch (error) {
    logger.error(`Error clearing table ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Insert data in batches
 */
async function insertDataBatch(tableName, data, batchSize = 100) {
  try {
    logger.info(`Inserting ${data.length} records into ${tableName}...`);
    
    let inserted = 0;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from(tableName)
        .insert(batch);
      
      if (error) {
        throw new Error(`Failed to insert batch into ${tableName}: ${error.message}`);
      }
      
      inserted += batch.length;
      logger.info(`Inserted ${inserted}/${data.length} records into ${tableName}`);
    }
    
    logger.success(`Successfully inserted all ${data.length} records into ${tableName}`);
    return true;
  } catch (error) {
    logger.error(`Error inserting data into ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Restore single table
 */
async function restoreTable(tableName, tableData, clearFirst = true) {
  try {
    if (!Array.isArray(tableData)) {
      if (tableData.error) {
        logger.warn(`Skipping ${tableName} - backup contains error: ${tableData.error}`);
        return false;
      }
      throw new Error(`Invalid data format for table ${tableName}`);
    }
    
    if (tableData.length === 0) {
      logger.info(`Table ${tableName} has no data to restore`);
      return true;
    }
    
    // Clear existing data if requested
    if (clearFirst) {
      await clearTable(tableName, false); // Don't ask for confirmation in batch mode
    }
    
    // Insert data in batches
    await insertDataBatch(tableName, tableData, config.batchSize);
    
    return true;
  } catch (error) {
    logger.error(`Failed to restore table ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Perform full database restore
 */
async function restoreDatabase(backupFilePath, options = {}) {
  const {
    clearFirst = true,
    skipConfirmation = false,
    tablesToRestore = null
  } = options;
  
  try {
    logger.info('Starting database restore...');
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Cannot proceed with restore - database connection failed');
    }
    
    // Load backup file
    const backupData = loadBackupFile(backupFilePath);
    
    // Determine tables to restore
    const tables = tablesToRestore || Object.keys(backupData.data);
    
    // Get current record counts
    logger.info('Getting current database state...');
    const currentCounts = await getCurrentRecordCounts(tables);
    
    // Show restore summary
    console.log('\n📊 Restore Summary:');
    console.log('==================');
    tables.forEach(table => {
      const backupCount = Array.isArray(backupData.data[table]) ? backupData.data[table].length : 'error';
      const currentCount = currentCounts[table];
      console.log(`${table}: ${currentCount} → ${backupCount} records`);
    });
    
    // Ask for final confirmation
    if (!skipConfirmation) {
      const shouldProceed = await askConfirmation(
        '\n⚠️  This will REPLACE ALL current data with backup data. Continue? (y/N): '
      );
      
      if (!shouldProceed) {
        logger.info('Restore cancelled by user');
        return { success: false, cancelled: true };
      }
    }
    
    // Perform restore
    const results = {};
    
    for (const table of tables) {
      try {
        logger.info(`\nRestoring table: ${table}`);
        const success = await restoreTable(table, backupData.data[table], clearFirst);
        results[table] = { success, error: null };
      } catch (error) {
        logger.error(`Failed to restore ${table}: ${error.message}`);
        results[table] = { success: false, error: error.message };
      }
    }
    
    // Verify restore
    logger.info('\nVerifying restore...');
    const finalCounts = await getCurrentRecordCounts(tables);
    
    // Generate restore report
    const timestamp = new Date().toISOString();
    const reportFileName = `restore_${timestamp.replace(/[:.]/g, '-').slice(0, 19)}_report.txt`;
    const reportFilePath = path.join(config.backupDir, reportFileName);
    
    const report = `
Database Restore Report
======================
Timestamp: ${timestamp}
Backup File: ${backupFilePath}
Tables Restored: ${tables.length}

Restore Results:
${Object.entries(results)
  .map(([table, result]) => `  ${table}: ${result.success ? 'SUCCESS' : 'FAILED' + (result.error ? ` (${result.error})` : '')}`)
  .join('\n')}

Record Counts After Restore:
${Object.entries(finalCounts)
  .map(([table, count]) => `  ${table}: ${count}`)
  .join('\n')}

Restore Status: ${Object.values(results).every(r => r.success) ? 'SUCCESS' : 'PARTIAL/FAILED'}
`;
    
    fs.writeFileSync(reportFilePath, report);
    
    const successCount = Object.values(results).filter(r => r.success).length;
    
    if (successCount === tables.length) {
      logger.success('✅ Database restore completed successfully!');
    } else {
      logger.warn(`⚠️  Restore completed with issues: ${successCount}/${tables.length} tables restored`);
    }
    
    console.log('\n📊 Final Record Counts:');
    Object.entries(finalCounts).forEach(([table, count]) => {
      console.log(`   ${table}: ${count} records`);
    });
    
    console.log(`\n📁 Report saved: ${reportFilePath}`);
    
    return {
      success: successCount === tables.length,
      results,
      finalCounts,
      reportFile: reportFilePath
    };
    
  } catch (error) {
    logger.error(`Restore failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * List available backup files
 */
function listBackupFiles() {
  try {
    const files = fs.readdirSync(config.backupDir)
      .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
      .map(file => {
        const filePath = path.join(config.backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          modified: stats.mtime
        };
      })
      .sort((a, b) => b.modified - a.modified); // Sort by modification time, newest first
    
    if (files.length === 0) {
      console.log('No backup files found in:', config.backupDir);
      return [];
    }
    
    console.log('\n📁 Available Backup Files:');
    console.log('===========================');
    files.forEach((file, index) => {
      const sizeKB = Math.round(file.size / 1024);
      console.log(`${index + 1}. ${file.name}`);
      console.log(`   Size: ${sizeKB} KB`);
      console.log(`   Date: ${file.modified.toLocaleString()}`);
      console.log('');
    });
    
    return files;
  } catch (error) {
    logger.error(`Error listing backup files: ${error.message}`);
    return [];
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Validate configuration
    if (!config.supabaseUrl || !config.supabaseKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    
    const args = process.argv.slice(2);
    
    // If no backup file specified, list available files
    if (args.length === 0) {
      console.log('Usage: node scripts/restore-database.js <backup-file>');
      listBackupFiles();
      process.exit(1);
    }
    
    let backupFilePath = args[0];
    
    // If relative path, assume it's in backup directory
    if (!path.isAbsolute(backupFilePath)) {
      backupFilePath = path.join(config.backupDir, backupFilePath);
    }
    
    logger.info('Starting database restore process...');
    logger.info(`Backup file: ${backupFilePath}`);
    
    const result = await restoreDatabase(backupFilePath);
    
    if (result.success) {
      logger.success('✅ Database restore completed successfully!');
      process.exit(0);
    } else if (result.cancelled) {
      logger.info('Restore cancelled by user');
      process.exit(0);
    } else {
      logger.error('❌ Database restore failed!');
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
      process.exit(1);
    }
    
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  restoreDatabase,
  loadBackupFile,
  listBackupFiles,
  testConnection
};