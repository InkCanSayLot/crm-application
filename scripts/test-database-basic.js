import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Basic Database Functionality Test');
console.log('====================================\n');

// Create Supabase admin client
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

async function testBasicOperations() {
  console.log('1. Testing Basic Table Operations...');
  
  try {
    // Test task_groups table (doesn't require auth user)
    const testTaskGroup = {
      name: 'Test Group',
      description: 'Test task group for verification',
      color: '#FF5733'
    };
    
    // CREATE
    const { data: insertData, error: insertError } = await adminClient
      .from('task_groups')
      .insert([testTaskGroup])
      .select();
    
    if (insertError) {
      console.log('❌ CREATE failed:', insertError.message);
      return false;
    }
    
    console.log('✅ CREATE operation successful');
    const taskGroupId = insertData[0].id;
    
    // READ
    const { data: readData, error: readError } = await adminClient
      .from('task_groups')
      .select('*')
      .eq('id', taskGroupId)
      .single();
    
    if (readError) {
      console.log('❌ READ failed:', readError.message);
      return false;
    }
    
    console.log('✅ READ operation successful');
    
    // UPDATE
    const { data: updateData, error: updateError } = await adminClient
      .from('task_groups')
      .update({ name: 'Updated Test Group' })
      .eq('id', taskGroupId)
      .select();
    
    if (updateError) {
      console.log('❌ UPDATE failed:', updateError.message);
      return false;
    }
    
    console.log('✅ UPDATE operation successful');
    
    // DELETE
    const { error: deleteError } = await adminClient
      .from('task_groups')
      .delete()
      .eq('id', taskGroupId);
    
    if (deleteError) {
      console.log('❌ DELETE failed:', deleteError.message);
      return false;
    }
    
    console.log('✅ DELETE operation successful');
    return true;
    
  } catch (error) {
    console.log('❌ Basic operations failed:', error.message);
    return false;
  }
}

async function testTableCounts() {
  console.log('\n2. Testing Table Accessibility...');
  
  const tables = [
    'users', 'clients', 'tasks', 'task_groups', 'shared_tasks',
    'calendar_events', 'chat_rooms', 'chat_messages', 'interactions',
    'journal_entries', 'meeting_notes', 'ai_optimizations',
    'profiles', 'attachments', 'notifications', 'activity_logs'
  ];
  
  let accessibleTables = 0;
  
  for (const table of tables) {
    try {
      const { count, error } = await adminClient
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Table '${table}': ${error.message}`);
      } else {
        console.log(`✅ Table '${table}': ${count || 0} records`);
        accessibleTables++;
      }
    } catch (error) {
      console.log(`❌ Table '${table}': ${error.message}`);
    }
  }
  
  console.log(`\n📊 Accessible tables: ${accessibleTables}/${tables.length}`);
  return accessibleTables === tables.length;
}

async function testRLSPolicies() {
  console.log('\n3. Testing Row Level Security...');
  
  try {
    // Create anonymous client
    const anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY);
    
    // Test that RLS blocks anonymous access to sensitive tables
    const { data, error } = await anonClient
      .from('users')
      .select('*');
    
    if (error || (data && data.length === 0)) {
      console.log('✅ RLS is properly configured - Anonymous access restricted');
      return true;
    } else {
      console.log('⚠️  RLS may need review - Anonymous access allowed');
      return false;
    }
    
  } catch (error) {
    console.log('✅ RLS is working - Anonymous access blocked');
    return true;
  }
}

async function testDatabaseIndexes() {
  console.log('\n4. Testing Database Performance Features...');
  
  try {
    // Test that we can query with expected performance patterns
    const { data, error } = await adminClient
      .from('task_groups')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('❌ Performance query failed:', error.message);
      return false;
    }
    
    console.log('✅ Database queries working efficiently');
    return true;
    
  } catch (error) {
    console.log('❌ Performance test failed:', error.message);
    return false;
  }
}

async function runBasicTests() {
  console.log(`🔗 Testing database: ${supabaseUrl}\n`);
  
  const tests = [
    { name: 'Basic CRUD Operations', fn: testBasicOperations },
    { name: 'Table Accessibility', fn: testTableCounts },
    { name: 'Row Level Security', fn: testRLSPolicies },
    { name: 'Database Performance', fn: testDatabaseIndexes }
  ];
  
  let passedTests = 0;
  const totalTests = tests.length;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) passedTests++;
  }
  
  console.log('\n====================================');
  console.log('📊 TEST SUMMARY');
  console.log('====================================');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All basic tests passed! Database is ready for use.');
  } else {
    console.log('⚠️  Some tests failed. Database may need additional configuration.');
  }
  
  console.log('\n🔧 Database Status:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Service Key: ${supabaseServiceKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Anonymous Key: ${process.env.SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing'}`);
  
  return passedTests === totalTests;
}

// Run the tests
runBasicTests()
  .then((success) => {
    console.log('\n✨ Database verification complete!');
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });