#!/usr/bin/env node

/**
 * Data Validation Script for Supabase Database
 * Ensures data integrity before and after deployment
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

dotenv.config();

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class DataValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {};
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '📊',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }[type] || 'ℹ️';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addError(message) {
    this.errors.push(message);
    this.log(message, 'error');
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log(message, 'warning');
  }

  async validateConnection() {
    this.log('Testing database connection...');
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (error) {
        this.addError(`Database connection failed: ${error.message}`);
        return false;
      }
      
      this.log('Database connection successful', 'success');
      return true;
    } catch (error) {
      this.addError(`Connection test failed: ${error.message}`);
      return false;
    }
  }

  async validateTableStructure() {
    this.log('Validating table structure...');
    
    const expectedTables = [
      'users',
      'clients', 
      'chat_rooms',
      'chat_messages',
      'files'
    ];
    
    for (const table of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          this.addError(`Table '${table}' validation failed: ${error.message}`);
        } else {
          this.log(`Table '${table}' structure valid`, 'success');
        }
      } catch (error) {
        this.addError(`Failed to validate table '${table}': ${error.message}`);
      }
    }
  }

  async validateDataIntegrity() {
    this.log('Validating data integrity...');
    
    // Check for orphaned records
    await this.checkOrphanedRecords();
    
    // Validate required fields
    await this.validateRequiredFields();
    
    // Check data consistency
    await this.checkDataConsistency();
  }

  async checkOrphanedRecords() {
    this.log('Checking for orphaned records...');
    
    try {
      // Check chat messages without rooms
      const { data: orphanedMessages, error: msgError } = await supabase
        .rpc('check_orphaned_messages');
      
      if (msgError && !msgError.message.includes('function')) {
        // If RPC doesn't exist, do manual check
        const { data: messages } = await supabase
          .from('chat_messages')
          .select('id, room_id')
          .limit(1000);
        
        const { data: rooms } = await supabase
          .from('chat_rooms')
          .select('id');
        
        const roomIds = new Set(rooms?.map(r => r.id) || []);
        const orphaned = messages?.filter(m => !roomIds.has(m.room_id)) || [];
        
        if (orphaned.length > 0) {
          this.addWarning(`Found ${orphaned.length} orphaned chat messages`);
        }
      }
      
      // Check files without owners
      const { data: files } = await supabase
        .from('files')
        .select('id, uploaded_by')
        .limit(1000);
      
      const { data: users } = await supabase
        .from('users')
        .select('id');
      
      const userIds = new Set(users?.map(u => u.id) || []);
      const orphanedFiles = files?.filter(f => f.uploaded_by && !userIds.has(f.uploaded_by)) || [];
      
      if (orphanedFiles.length > 0) {
        this.addWarning(`Found ${orphanedFiles.length} orphaned files`);
      }
      
    } catch (error) {
      this.addWarning(`Could not check orphaned records: ${error.message}`);
    }
  }

  async validateRequiredFields() {
    this.log('Validating required fields...');
    
    const validations = [
      {
        table: 'users',
        field: 'email',
        condition: 'email IS NULL OR email = \'\'''
      },
      {
        table: 'clients',
        field: 'name',
        condition: 'name IS NULL OR name = \'\'''
      },
      {
        table: 'chat_rooms',
        field: 'name',
        condition: 'name IS NULL OR name = \'\'''
      }
    ];
    
    for (const validation of validations) {
      try {
        const { count, error } = await supabase
          .from(validation.table)
          .select('*', { count: 'exact', head: true })
          .or(validation.condition);
        
        if (error) {
          this.addWarning(`Could not validate ${validation.table}.${validation.field}: ${error.message}`);
        } else if (count > 0) {
          this.addError(`Found ${count} records in ${validation.table} with missing ${validation.field}`);
        }
      } catch (error) {
        this.addWarning(`Validation failed for ${validation.table}.${validation.field}: ${error.message}`);
      }
    }
  }

  async checkDataConsistency() {
    this.log('Checking data consistency...');
    
    try {
      // Check for duplicate emails
      const { data: duplicateEmails } = await supabase
        .rpc('find_duplicate_emails');
      
      if (duplicateEmails && duplicateEmails.length > 0) {
        this.addWarning(`Found ${duplicateEmails.length} duplicate email addresses`);
      }
    } catch (error) {
      // Manual check if RPC doesn't exist
      try {
        const { data: users } = await supabase
          .from('users')
          .select('email')
          .not('email', 'is', null);
        
        const emailCounts = {};
        users?.forEach(user => {
          emailCounts[user.email] = (emailCounts[user.email] || 0) + 1;
        });
        
        const duplicates = Object.entries(emailCounts)
          .filter(([email, count]) => count > 1);
        
        if (duplicates.length > 0) {
          this.addWarning(`Found ${duplicates.length} duplicate email addresses`);
        }
      } catch (manualError) {
        this.addWarning(`Could not check email duplicates: ${manualError.message}`);
      }
    }
  }

  async gatherStatistics() {
    this.log('Gathering database statistics...');
    
    const tables = ['users', 'clients', 'chat_rooms', 'chat_messages', 'files'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          this.addWarning(`Could not count records in ${table}: ${error.message}`);
          this.stats[table] = 'unknown';
        } else {
          this.stats[table] = count;
          this.log(`${table}: ${count} records`);
        }
      } catch (error) {
        this.addWarning(`Failed to get statistics for ${table}: ${error.message}`);
        this.stats[table] = 'error';
      }
    }
  }

  async validateRLSPolicies() {
    this.log('Validating RLS policies...');
    
    const tables = ['users', 'clients', 'chat_rooms', 'chat_messages', 'files'];
    
    for (const table of tables) {
      try {
        // Check if RLS is enabled
        const { data: rlsStatus } = await supabase
          .rpc('check_rls_enabled', { table_name: table });
        
        if (!rlsStatus) {
          this.addWarning(`RLS might not be enabled for table '${table}'`);
        }
      } catch (error) {
        this.addWarning(`Could not check RLS status for ${table}: ${error.message}`);
      }
    }
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      status: this.errors.length === 0 ? 'PASS' : 'FAIL',
      statistics: this.stats,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        total_errors: this.errors.length,
        total_warnings: this.warnings.length,
        tables_validated: Object.keys(this.stats).length
      }
    };
    
    // Save report to file
    const reportPath = `validation-report-${Date.now()}.json`;
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      this.log(`Validation report saved to ${reportPath}`);
    } catch (error) {
      this.log(`Could not save report: ${error.message}`, 'warning');
    }
    
    return report;
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 DATABASE VALIDATION SUMMARY');
    console.log('='.repeat(50));
    
    if (this.errors.length === 0) {
      this.log('Database validation PASSED', 'success');
    } else {
      this.log(`Database validation FAILED with ${this.errors.length} errors`, 'error');
    }
    
    if (this.warnings.length > 0) {
      this.log(`Found ${this.warnings.length} warnings`, 'warning');
    }
    
    console.log('\nDatabase Statistics:');
    Object.entries(this.stats).forEach(([table, count]) => {
      console.log(`  ${table}: ${count}`);
    });
    
    console.log('\n' + '='.repeat(50));
  }
}

async function main() {
  const validator = new DataValidator();
  
  console.log('🔍 Starting database validation...');
  console.log('='.repeat(50));
  
  // Run all validations
  const connected = await validator.validateConnection();
  
  if (!connected) {
    console.log('❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  await validator.validateTableStructure();
  await validator.validateDataIntegrity();
  await validator.gatherStatistics();
  await validator.validateRLSPolicies();
  
  // Generate report
  const report = await validator.generateReport();
  
  // Print summary
  validator.printSummary();
  
  // Exit with appropriate code
  process.exit(validator.errors.length > 0 ? 1 : 0);
}

// Run validation if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Validation script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { DataValidator };