import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Opening Schema Executor...');

// Read environment variables
const envPath = path.join(__dirname, '..', '.env');
let supabaseUrl = '';
let serviceKey = '';

if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '');
        }
        if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
            serviceKey = line.split('=')[1].trim().replace(/['"]/g, '');
        }
    }
}

// If not found in .env, use the known values
if (!supabaseUrl) {
    supabaseUrl = 'https://kifvxrjpvkoilzxuehci.supabase.co';
}

// Construct the URL with parameters
const htmlFile = path.join(__dirname, '..', 'execute-schema.html');
const fileUrl = `file:///${htmlFile.replace(/\\/g, '/')}`;

let urlWithParams = fileUrl;
if (supabaseUrl) {
    const restUrl = supabaseUrl.includes('/rest/v1') ? supabaseUrl : `${supabaseUrl}/rest/v1`;
    urlWithParams += `?url=${encodeURIComponent(restUrl)}`;
    
    if (serviceKey) {
        urlWithParams += `&key=${encodeURIComponent(serviceKey)}`;
    }
}

console.log('📋 Schema Executor Details:');
console.log(`   File: ${htmlFile}`);
console.log(`   Supabase URL: ${supabaseUrl || 'Not found - please enter manually'}`);
console.log(`   Service Key: ${serviceKey ? 'Found ✅' : 'Not found - please enter manually ⚠️'}`);
console.log('');

// Open in default browser
console.log('🌐 Opening in browser...');
exec(`start "" "${urlWithParams}"`, (error) => {
    if (error) {
        console.log('❌ Could not auto-open browser. Please manually open:');
        console.log(`   ${htmlFile}`);
    } else {
        console.log('✅ Schema executor opened in browser');
    }
    
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Fill in your Supabase credentials if not auto-filled');
    console.log('2. Click "Execute Database Schema"');
    console.log('3. Follow the instructions to manually run the SQL');
    console.log('4. Come back here and run: node scripts/verify-schema.js');
});