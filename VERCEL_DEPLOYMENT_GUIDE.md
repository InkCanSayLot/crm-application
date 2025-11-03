# Vercel Deployment Guide

## Overview
This guide will help you deploy your CRM application to Vercel with both frontend and backend functionality.

## Prerequisites
1. Vercel account
2. Vercel CLI installed (`npm i -g vercel`)
3. Supabase project configured

## Deployment Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy the Project
```bash
vercel --prod
```

## Environment Variables Configuration

After deployment, you need to configure the following environment variables in your Vercel dashboard:

### Backend Environment Variables
```
NODE_ENV=production
JWT_SECRET=your_jwt_secret_key_here_generate_a_random_string
PORT=3000

# Supabase Configuration
SUPABASE_URL=https://wetixgvebtoelgaxyuez.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldGl4Z3ZlYnRvZWxnYXh5dWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzcxMzUsImV4cCI6MjA3MzcxMzEzNX0.af8RxfXMQc1GQQgVzsJrCECLYrjlZe4SwjW4xI1rqXs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldGl4Z3ZlYnRvZWxnYXh5dWV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEzNzEzNSwiZXhwIjoyMDczNzEzMTM1fQ.tyY-SrkUPDYVBp3VrYGDWzoD0mOb8CT-asRVnfLDBtw

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Default Admin Credentials
DEFAULT_ADMIN_EMAIL=admin@emptyad.com
DEFAULT_ADMIN_PASSWORD=emptyad123
```

### Frontend Environment Variables (VITE_ prefix)
```
VITE_SUPABASE_URL=https://wetixgvebtoelgaxyuez.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldGl4Z3ZlYnRvZWxnYXh5dWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzcxMzUsImV4cCI6MjA3MzcxMzEzNX0.af8RxfXMQc1GQQgVzsJrCECLYrjlZe4SwjW4xI1rqXs
```

**Important**: Do NOT set `VITE_API_BASE_URL` for Vercel deployment. The frontend will automatically use relative paths (`/api`) which will be handled by Vercel's routing configuration.

## Post-Deployment Configuration

### 1. Update CORS Origins
After deployment, update the `CORS_ORIGIN` environment variable in Vercel dashboard:
```
CORS_ORIGIN=https://your-vercel-app.vercel.app
```

### 2. Test the Deployment
1. Visit your Vercel app URL
2. Test login functionality
3. Test API endpoints
4. Verify database connectivity

## Project Structure
- **Frontend**: React + Vite application (builds to `/dist`)
- **Backend**: Express.js API (serverless functions in `/api`)
- **Database**: Supabase PostgreSQL
- **Routing**: Configured in `vercel.json`

## Key Features Configured
✅ Serverless API functions  
✅ Static file serving  
✅ Client-side routing support  
✅ CORS configuration  
✅ Environment variable handling  
✅ Production optimizations  

## Troubleshooting

### API Routes Not Working
- Ensure `vercel.json` is properly configured
- Check that API routes start with `/api/`
- Verify environment variables are set

### CORS Errors
- Update `CORS_ORIGIN` environment variable
- Check that the frontend domain is included

### Database Connection Issues
- Verify Supabase credentials
- Check RLS policies are properly configured
- Ensure service role key has proper permissions

## Commands for Local Testing
```bash
# Install dependencies
npm install

# Run development server (both frontend and backend)
npm run dev

# Build for production
npm run build

# Test production build locally
npm run preview
```

## Deployment Commands
```bash
# Deploy to Vercel
vercel --prod

# Deploy preview (staging)
vercel

# Check deployment status
vercel ls

# View logs
vercel logs
```