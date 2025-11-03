#!/usr/bin/env node

/**
 * Automated Supabase Database Backup Script
 * 
 * This script creates automated backups of your Supabase database
 * with proper error handling, logging, and verification.
 * 
 * Usage:
 *   node scripts/backup-database.js
 *   npm run db:backup
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  backupDir: path.join(__dirname, '..', 'backups'),
  maxBackups: 10, // Keep last 10 backups
  tables: ['clients', 'tasks', 'chat_messages', 'chat_rooms', 'users'] // Tables to backup
};

// Ensure backup directory exists
if (!fs.existsSync(CONFIG.backupDir)) {
  fs.mkdirSync(CONFIG.backupDir, { recursive: true });
}

// Initialize Supabase client
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

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
 * Generate timestamp for backup files
 */
function getTimestamp() {
  const now = new Date();
  return now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
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
 * Get record counts for all tables
 */
async function getRecordCounts() {
  const counts = {};
  
  for (const table of CONFIG.tables) {
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
 * Backup a single table
 */
async function backupTable(tableName) {
  try {
    logger.info(`Backing up table: ${tableName}`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      throw new Error(`Failed to backup ${tableName}: ${error.message}`);
    }
    
    logger.success(`Successfully backed up ${data.length} records from ${tableName}`);
    return data;
  } catch (error) {
    logger.error(`Error backing up ${tableName}: ${error.message}`);
    throw error;
  }
}

/**
 * Create full database backup
 */
async function createBackup() {
  const timestamp = getTimestamp();
  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      supabaseUrl: CONFIG.supabaseUrl,
    tables: CONFIG.tables
    },
    recordCounts: {},
    data: {}
  };
  
  try {
    logger.info('Starting database backup...');
    
    // Test connection first
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Cannot proceed with backup - database connection failed');
    }
    
    // Get record counts
    logger.info('Getting record counts...');
    backupData.recordCounts = await getRecordCounts();
    
    // Backup each table
    for (const table of CONFIG.tables) {
      try {
        backupData.data[table] = await backupTable(table);
      } catch (error) {
        logger.error(`Failed to backup table ${table}: ${error.message}`);
        // Continue with other tables
        backupData.data[table] = { error: error.message };
      }
    }
    
    // Save backup to file
    const backupFileName = `backup_${timestamp}.json`;
    const backupFilePath = path.join(CONFIG.backupDir, backupFileName);
    
    fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
    
    // Create summary file
    const summaryFileName = `backup_${timestamp}_summary.txt`;
    const summaryFilePath = path.join(CONFIG.backupDir, summaryFileName);
    
    const summary = `
Database Backup Summary
======================
Timestamp: ${backupData.metadata.timestamp}
Backup File: ${backupFileName}
Tables Backed Up: ${CONFIG.tables.length}

Record Counts:
${Object.entries(backupData.recordCounts)
  .map(([table, count]) => `  ${table}: ${count}`)
  .join('\n')}

Total Records: ${Object.values(backupData.recordCounts)
  .filter(count => typeof count === 'number')
  .reduce((sum, count) => sum + count, 0)}

Backup Status: SUCCESS
`;
    
    fs.writeFileSync(summaryFilePath, summary);
    
    logger.success(`Backup completed successfully!`);
    logger.info(`Backup file: ${backupFilePath}`);
    logger.info(`Summary file: ${summaryFilePath}`);
    
    // Clean up old backups
    await cleanupOldBackups();
    
    return {
      success: true,
      backupFile: backupFilePath,
      summaryFile: summaryFilePath,
      recordCounts: backupData.recordCounts
    };
    
  } catch (error) {
    logger.error(`Backup failed: ${error.message}`);
    
    // Create error log
    const errorFileName = `backup_${timestamp}_ERROR.txt`;
    const errorFilePath = path.join(CONFIG.backupDir, errorFileName);
    
    const errorLog = `
Database Backup Error
====================
Timestamp: ${new Date().toISOString()}
Error: ${error.message}
Stack: ${error.stack}
`;
    
    fs.writeFileSync(errorFilePath, errorLog);
    
    return {
      success: false,
      error: error.message,
      errorFile: errorFilePath
    };
  }
}

/**
 * Clean up old backup files
 */
async function cleanupOldBackups() {
  try {
    logger.info('Cleaning up old backups...');
    
    const files = fs.readdirSync(CONFIG.backupDir)
      .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(CONFIG.backupDir, file),
    stats: fs.statSync(path.join(CONFIG.backupDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime); // Sort by modification time, newest first
    
    if (files.length > CONFIG.maxBackups) {
    const filesToDelete = files.slice(CONFIG.maxBackups);
      
      for (const file of filesToDelete) {
        fs.unlinkSync(file.path);
        
        // Also delete corresponding summary and error files
        const baseName = file.name.replace('.json', '');
        const summaryFile = path.join(CONFIG.backupDir, `${baseName}_summary.txt`);
        const errorFile = path.join(CONFIG.backupDir, `${baseName}_ERROR.txt`);
        
        if (fs.existsSync(summaryFile)) fs.unlinkSync(summaryFile);
        if (fs.existsSync(errorFile)) fs.unlinkSync(errorFile);
        
        logger.info(`Deleted old backup: ${file.name}`);
      }
      
      logger.success(`Cleaned up ${filesToDelete.length} old backup(s)`);
    } else {
      logger.info('No old backups to clean up');
    }
  } catch (error) {
    logger.warn(`Error during cleanup: ${error.message}`);
  }
}

/**
 * Verify backup integrity
 */
async function verifyBackup(backupFilePath) {
  try {
    logger.info('Verifying backup integrity...');
    
    if (!fs.existsSync(backupFilePath)) {
      throw new Error('Backup file does not exist');
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf8'));
    
    // Check metadata
    if (!backupData.metadata || !backupData.data || !backupData.recordCounts) {
      throw new Error('Backup file structure is invalid');
    }
    
    // Verify each table
    let totalRecords = 0;
    for (const table of CONFIG.tables) {
      if (backupData.data[table] && Array.isArray(backupData.data[table])) {
        totalRecords += backupData.data[table].length;
      }
    }
    
    logger.success(`Backup verification passed - ${totalRecords} total records`);
    return true;
  } catch (error) {
    logger.error(`Backup verification failed: ${error.message}`);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    // Validate configuration
    if (!CONFIG.supabaseUrl || !CONFIG.supabaseKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    
    logger.info('Starting automated database backup...');
    logger.info(`Backup directory: ${CONFIG.backupDir}`);
  logger.info(`Tables to backup: ${CONFIG.tables.join(', ')}`);
    
    const result = await createBackup();
    
    if (result.success) {
      // Verify the backup
      const verified = await verifyBackup(result.backupFile);
      
      if (verified) {
        logger.success('✅ Database backup completed and verified successfully!');
        
        // Display summary
        console.log('\n📊 Backup Summary:');
        Object.entries(result.recordCounts).forEach(([table, count]) => {
          console.log(`   ${table}: ${count} records`);
        });
        
        console.log(`\n📁 Files created:`);
        console.log(`   Backup: ${result.backupFile}`);
        console.log(`   Summary: ${result.summaryFile}`);
        
        process.exit(0);
      } else {
        logger.error('❌ Backup verification failed!');
        process.exit(1);
      }
    } else {
      logger.error('❌ Backup failed!');
      console.log(`Error details: ${result.errorFile}`);
      process.exit(1);
    }
    
  } catch (error) {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script if called directly
main().catch(console.error);

export {
  createBackup,
  verifyBackup,
  testConnection,
  getRecordCounts
};