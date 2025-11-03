# Supabase Account Migration Guide

This guide will help you migrate your CRM application from your current Supabase account to a new Supabase account with a different email address.

## Overview

Your current Supabase project:
- URL: `https://wetixgvebtoelgaxyuez.supabase.co`
- Project ID: `wetixgvebtoelgaxyuez`

## Step-by-Step Migration Process

### Step 1: Create New Supabase Account

1. **Sign up for new Supabase account:**
   - Go to [https://supabase.com](https://supabase.com)
   - Click "Sign Up"
   - Use your desired new email address
   - Complete the registration process

2. **Create a new project:**
   - After logging in, click "New Project"
   - Choose your organization (or create a new one)
   - Set project name: `Empty CRM Personal` (or your preferred name)
   - Set database password (save this securely!)
   - Choose a region close to your users
   - Click "Create new project"

### Step 2: Get New Project Credentials

Once your new project is created:

1. Go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-new-project-id.supabase.co`)
   - **anon public key**
   - **service_role secret key**

### Step 3: Export Current Database Data

Before switching, we need to backup your current data:

1. **Using Supabase Dashboard:**
   - Go to your current project dashboard
   - Navigate to **Database** → **Backups**
   - Create a manual backup
   - Download the backup file

2. **Using our backup script:**
   - Run the backup script we created: `node scripts/backup-database.js`
   - This will create a JSON backup of all your data

### Step 4: Set Up New Database Schema

1. **Run migrations on new project:**
   - Update your `.env` file with new credentials (temporarily)
   - Run: `npm run db:migrate` (if available) or manually run migrations
   - All migration files in `supabase/migrations/` need to be applied

2. **Set up Storage buckets:**
   - Create the `avatars` bucket in your new project
   - Configure the same storage policies

### Step 5: Import Data to New Project

1. **Using SQL import:**
   - In new Supabase dashboard, go to **SQL Editor**
   - Import your backup SQL file

2. **Using our restore script:**
   - Run: `node scripts/restore-database.js`
   - This will import the JSON backup data

### Step 6: Update Environment Variables

Update your `.env` file with new credentials:

```env
# Database Configuration
SUPABASE_URL=https://your-new-project-id.supabase.co
SUPABASE_ANON_KEY=your_new_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key

# Frontend Environment Variables
VITE_SUPABASE_URL=https://your-new-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_new_anon_key
```

### Step 7: Update Railway Deployment

1. **Update Railway environment variables:**
   - Go to your Railway project dashboard
   - Navigate to **Variables**
   - Update all Supabase-related variables with new values

2. **Redeploy:**
   - Railway will automatically redeploy with new variables
   - Monitor the deployment logs for any issues

### Step 8: Test the Migration

1. **Local testing:**
   - Start your local development server
   - Test all functionality:
     - User authentication
     - Data retrieval (clients, deals, etc.)
     - Data creation/updates
     - File uploads (avatars)

2. **Production testing:**
   - Test the deployed Railway application
   - Verify all features work correctly

## Important Notes

⚠️ **Before Starting:**
- Create a complete backup of your current data
- Test the migration process in a development environment first
- Have your current Supabase credentials handy in case you need to rollback

⚠️ **During Migration:**
- Your application will be temporarily unavailable during the switch
- Plan the migration during low-usage hours
- Keep both projects active until migration is confirmed successful

⚠️ **After Migration:**
- Monitor your application for 24-48 hours
- Keep the old Supabase project for at least a week as backup
- Update any external integrations that might use the old URLs

## Rollback Plan

If something goes wrong:

1. Revert `.env` file to original credentials
2. Redeploy Railway with original environment variables
3. Your application will be back to the original state

## Support

If you encounter issues during migration:
1. Check the migration logs
2. Verify all environment variables are correct
3. Ensure all migrations ran successfully
4. Test database connectivity

## Files That Will Be Updated

- `.env` (local environment)
- Railway environment variables
- Any hardcoded Supabase URLs in the codebase (if any)

## Estimated Migration Time

- Account setup: 10 minutes
- Data export: 15-30 minutes (depending on data size)
- Schema setup: 20-30 minutes
- Data import: 15-30 minutes
- Testing: 30-60 minutes

**Total estimated time: 2-3 hours**