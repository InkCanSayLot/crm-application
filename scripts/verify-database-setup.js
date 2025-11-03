import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

console.log('🔍 Database Setup Verification Script');
console.log('=====================================\n');

// Create Supabase clients
const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('1. Testing Database Connection...');
  
  try {
    // Test admin connection
    const { data: adminData, error: adminError } = await adminClient
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (adminError) {
      console.log('❌ Admin connection failed:', adminError.message);
      return false;
    }
    
    console.log('✅ Admin connection successful');
    
    // Test anonymous connection
    const { data: anonData, error: anonError } = await anonClient
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (anonError) {
      console.log('❌ Anonymous connection failed:', anonError.message);
      return false;
    }
    
    console.log('✅ Anonymous connection successful');
    return true;
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return false;
  }
}

async function testTableStructure() {
  console.log('\n2. Testing Table Structure...');
  
  const requiredTables = [
    'users', 'clients', 'tasks', 'task_groups', 'shared_tasks',
    'calendar_events', 'chat_rooms', 'chat_messages', 'interactions',
    'journal_entries', 'meeting_notes', 'ai_optimizations'
  ];
  
  let allTablesExist = true;
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await adminClient
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}' not accessible:`, error.message);
        allTablesExist = false;
      } else {
        console.log(`✅ Table '${table}' exists and accessible`);
      }
    } catch (error) {
      console.log(`❌ Error checking table '${table}':`, error.message);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function testCRUDOperations() {
  console.log('\n3. Testing CRUD Operations...');
  
  try {
    // Test CREATE - Insert a test user
    const testUser = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'test@example.com',
      full_name: 'Test User',
      name: 'Test',
      role: 'user'
    };
    
    const { data: insertData, error: insertError } = await adminClient
      .from('users')
      .insert([testUser])
      .select();
    
    if (insertError) {
      console.log('❌ CREATE operation failed:', insertError.message);
      return false;
    }
    
    console.log('✅ CREATE operation successful');
    
    // Test READ - Fetch the user
    const { data: readData, error: readError } = await adminClient
      .from('users')
      .select('*')
      .eq('id', testUser.id)
      .single();
    
    if (readError) {
      console.log('❌ READ operation failed:', readError.message);
      return false;
    }
    
    console.log('✅ READ operation successful');
    
    // Test UPDATE - Update the user
    const { data: updateData, error: updateError } = await adminClient
      .from('users')
      .update({ full_name: 'Updated Test User' })
      .eq('id', testUser.id)
      .select();
    
    if (updateError) {
      console.log('❌ UPDATE operation failed:', updateError.message);
      return false;
    }
    
    console.log('✅ UPDATE operation successful');
    
    // Test DELETE - Remove the user
    const { error: deleteError } = await adminClient
      .from('users')
      .delete()
      .eq('id', testUser.id);
    
    if (deleteError) {
      console.log('❌ DELETE operation failed:', deleteError.message);
      return false;
    }
    
    console.log('✅ DELETE operation successful');
    return true;
    
  } catch (error) {
    console.log('❌ CRUD operations failed:', error.message);
    return false;
  }
}

async function testRowLevelSecurity() {
  console.log('\n4. Testing Row Level Security (RLS)...');
  
  try {
    // Test that anonymous users cannot access users table without proper auth
    const { data: anonData, error: anonError } = await anonClient
      .from('users')
      .select('*');
    
    // RLS should prevent access, so we expect an error or empty result
    if (anonError || (anonData && anonData.length === 0)) {
      console.log('✅ RLS is working - Anonymous access properly restricted');
      return true;
    } else {
      console.log('⚠️  RLS may not be properly configured - Anonymous access allowed');
      return false;
    }
    
  } catch (error) {
    console.log('✅ RLS is working - Anonymous access blocked:', error.message);
    return true;
  }
}

async function testRelationships() {
  console.log('\n5. Testing Table Relationships...');
  
  try {
    // Test creating related records
    const testUser = {
      id: '00000000-0000-0000-0000-000000000002',
      email: 'relationship-test@example.com',
      full_name: 'Relationship Test User',
      role: 'user'
    };
    
    // Insert test user
    await adminClient.from('users').insert([testUser]);
    
    // Test creating a client assigned to this user
    const testClient = {
      company_name: 'Test Company',
      contact_name: 'Test Contact',
      email: 'contact@testcompany.com',
      assigned_to: testUser.id,
      user_id: testUser.id
    };
    
    const { data: clientData, error: clientError } = await adminClient
      .from('clients')
      .insert([testClient])
      .select();
    
    if (clientError) {
      console.log('❌ Relationship test failed (client creation):', clientError.message);
      return false;
    }
    
    // Test creating a task for this client
    const testTask = {
      title: 'Test Task',
      description: 'Test task description',
      assigned_to: testUser.id,
      client_id: clientData[0].id,
      user_id: testUser.id
    };
    
    const { data: taskData, error: taskError } = await adminClient
      .from('tasks')
      .insert([testTask])
      .select();
    
    if (taskError) {
      console.log('❌ Relationship test failed (task creation):', taskError.message);
      return false;
    }
    
    // Clean up test data
    await adminClient.from('tasks').delete().eq('id', taskData[0].id);
    await adminClient.from('clients').delete().eq('id', clientData[0].id);
    await adminClient.from('users').delete().eq('id', testUser.id);
    
    console.log('✅ Table relationships working correctly');
    return true;
    
  } catch (error) {
    console.log('❌ Relationship test failed:', error.message);
    return false;
  }
}

async function runVerification() {
  console.log(`🔗 Connecting to: ${supabaseUrl}\n`);
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'Table Structure', fn: testTableStructure },
    { name: 'CRUD Operations', fn: testCRUDOperations },
    { name: 'Row Level Security', fn: testRowLevelSecurity },
    { name: 'Table Relationships', fn: testRelationships }
  ];
  
  let passedTests = 0;
  const totalTests = tests.length;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) passedTests++;
  }
  
  console.log('\n=====================================');
  console.log('📊 VERIFICATION SUMMARY');
  console.log('=====================================');
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Database setup is complete and working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please review the issues above.');
  }
  
  console.log('\n🔧 Database Configuration:');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Anon Key: ${supabaseAnonKey ? '✅ Configured' : '❌ Missing'}`);
  console.log(`   Service Key: ${supabaseServiceKey ? '✅ Configured' : '❌ Missing'}`);
  
  return passedTests === totalTests;
}

// Run the verification
runVerification()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Verification script failed:', error);
    process.exit(1);
  });