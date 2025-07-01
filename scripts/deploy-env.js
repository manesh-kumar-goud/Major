#!/usr/bin/env node

/**
 * 🚀 VERCEL ENVIRONMENT VARIABLES AUTO-IMPORT SCRIPT
 * 
 * This script automatically imports environment variables from .env.example
 * to your Vercel project, saving you from manual entry.
 * 
 * Usage:
 * 1. Fill in your actual values in .env.production
 * 2. Run: node scripts/deploy-env.js
 * 3. Or use: npm run deploy-env
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const ENV_FILE = '.env.production';
const PROJECT_NAME = 'major'; // Change this to your Vercel project name

console.log('🚀 Vercel Environment Variables Auto-Import');
console.log('===========================================\n');

// Check if .env.production exists
const envPath = path.join(process.cwd(), ENV_FILE);
if (!fs.existsSync(envPath)) {
    console.log('❌ .env.production file not found!');
    console.log('📝 Please create .env.production with your actual values:');
    console.log('   cp .env.example .env.production');
    console.log('   # Then edit .env.production with real values\n');
    process.exit(1);
}

// Read and parse environment variables
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
    // Skip comments and empty lines
    if (line.trim() && !line.trim().startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            // Skip placeholder values
            if (!value.includes('your_') && !value.includes('change_this')) {
                envVars[key.trim()] = value;
            }
        }
    }
});

console.log(`📋 Found ${Object.keys(envVars).length} environment variables:`);
Object.keys(envVars).forEach(key => {
    const value = envVars[key];
    const displayValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
    console.log(`   ✅ ${key} = ${displayValue}`);
});
console.log('');

// Check if Vercel CLI is installed
try {
    execSync('vercel --version', { stdio: 'pipe' });
} catch (error) {
    console.log('❌ Vercel CLI not found!');
    console.log('📦 Install it with: npm i -g vercel');
    console.log('🔗 Or use: npx vercel');
    process.exit(1);
}

// Import environment variables to Vercel
console.log('🔄 Importing environment variables to Vercel...\n');

try {
    // Login check
    execSync('vercel whoami', { stdio: 'pipe' });
} catch (error) {
    console.log('🔐 Please login to Vercel first:');
    console.log('   vercel login');
    process.exit(1);
}

// Set each environment variable
let successCount = 0;
let errorCount = 0;

for (const [key, value] of Object.entries(envVars)) {
    try {
        console.log(`📤 Setting ${key}...`);
        execSync(`vercel env add ${key} production`, {
            input: value,
            stdio: ['pipe', 'pipe', 'pipe']
        });
        console.log(`   ✅ ${key} set successfully`);
        successCount++;
    } catch (error) {
        console.log(`   ❌ Failed to set ${key}`);
        errorCount++;
    }
}

console.log('\n===========================================');
console.log(`📊 Import Summary:`);
console.log(`   ✅ Success: ${successCount} variables`);
console.log(`   ❌ Errors: ${errorCount} variables`);

if (successCount > 0) {
    console.log('\n🎉 Environment variables imported successfully!');
    console.log('🔄 Your next deployment will use these variables.');
    console.log('📝 To deploy now: vercel --prod');
} else {
    console.log('\n❌ No variables were imported. Please check your setup.');
}

console.log('\n💡 Alternative: Use Vercel Dashboard');
console.log('   1. Go to vercel.com → Your Project → Settings');
console.log('   2. Click "Environment Variables"');
console.log('   3. Add variables manually'); 