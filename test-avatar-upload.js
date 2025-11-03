import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Test script to verify avatar upload functionality
async function testAvatarUpload() {
  try {
    // Supabase credentials
    const supabaseUrl = 'https://wetixgvebtoelgaxyuez.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldGl4Z3ZlYnRvZWxnYXh5dWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzcxMzUsImV4cCI6MjA3MzcxMzEzNX0.af8RxfXMQc1GQQgVzsJrCECLYrjlZe4SwjW4xI1rqXs';
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test with a demo user ID (matching the demo users in AuthContext)
    const demoUserId = '550e8400-e29b-41d4-a716-446655440000';
    
    // Create a simple test file buffer
    const testImageBuffer = Buffer.from('test image data');
    
    console.log('Testing avatar upload with fixed storage policies...');
    
    // Test the upload with the corrected path structure
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(`${demoUserId}/avatar.jpg`, testImageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('Upload failed:', error);
      return false;
    }
    
    console.log('Upload successful:', data);
    
    // Test getting the public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(`${demoUserId}/avatar.jpg`);
    
    console.log('Public URL:', urlData.publicUrl);
    
    return true;
  } catch (err) {
    console.error('Test failed:', err);
    return false;
  }
}

// Run the test
testAvatarUpload().then(success => {
  if (success) {
    console.log('✅ Avatar upload test passed! Storage policies are working correctly.');
  } else {
    console.log('❌ Avatar upload test failed. Check storage policies.');
  }
});

console.log('Note: Make sure to update the Supabase credentials in this file before running.');
console.log('Run with: node test-avatar-upload.js');