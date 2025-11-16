# Vercel Deployment Guide

This guide will help you deploy both the frontend and backend of the Empty CRM Personal application to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com) if you haven't already
2. **Node.js**: Ensure you have Node.js 20+ installed locally
3. **Git**: Your project should be in a Git repository
4. **Supabase Account**: You'll need your Supabase project credentials

## Environment Variables Setup

Before deploying, you need to set up the environment variables in Vercel:

### Required Environment Variables

Copy these from your `.env.vercel` file and add them to your Vercel project:

```bash
# Database Configuration
SUPABASE_URL=https://aajotmyiuoyqtvdmtrfp.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFham90bXlpdW95cXR2ZG10cmZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTc0MzgsImV4cCI6MjA3ODQ5MzQzOH0.kmQch0yS5gnhBbHxNWuKv7GrYAjjMqc677qY2-E6rS8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFham90bXlpdW95cXR2ZG10cmZwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjkxNzQzOCwiZXhwIjoyMDc4NDkzNDM4fQ.NLXcdZsC1C7q-_yQBeMShNxcANalXXzdX0-vBzUe710

# Frontend Environment Variables (VITE_ prefix required)
VITE_SUPABASE_URL=https://aajotmyiuoyqtvdmtrfp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFham90bXlpdW95cXR2ZG10cmZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTc0MzgsImV4cCI6MjA3ODQ5MzQzOH0.kmQch0yS5gnhBbHxNWuKv7GrYAjjMqc677qY2-E6rS8
VITE_API_BASE_URL=/api

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_generate_a_random_string

# Server Configuration
PORT=3001
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://your-domain.vercel.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Setting Environment Variables in Vercel

1. Go to your Vercel dashboard
2. Select your project (or create a new one)
3. Go to "Settings" → "Environment Variables"
4. Add each variable from the list above
5. Make sure to set the correct values for your Supabase project

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your Git repository (GitHub, GitLab, or Bitbucket)

2. **Configure Project**:
   - Vercel should automatically detect the framework (Vite)
   - Set the build command: `npm run vercel:build`
   - Set the output directory: `dist`
   - Set the install command: `npm install`

3. **Set Environment Variables**:
   - Add all the environment variables listed above
   - Make sure to use your actual Supabase credentials

4. **Deploy**:
   - Click "Deploy" and wait for the build to complete
   - Your app should be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   # Deploy to preview
   vercel

   # Deploy to production
   vercel --prod
   ```

4. **Set Environment Variables**:
   ```bash
   vercel env add SUPABASE_URL production
   vercel env add SUPABASE_ANON_KEY production
   # Add all other environment variables
   ```

## Post-Deployment Configuration

### 1. Update CORS Origin

After deployment, update the `CORS_ORIGIN` environment variable to match your actual Vercel domain:

```bash
CORS_ORIGIN=https://your-project-name.vercel.app
```

### 2. Configure Supabase

Make sure your Supabase project allows connections from your Vercel domain:

1. Go to your Supabase dashboard
2. Navigate to "Authentication" → "URL Configuration"
3. Add your Vercel domain to "Site URL" and "Additional Redirect URLs"
4. Go to "Settings" → "API" and ensure your project is properly configured

### 3. Update Frontend API URL

The frontend is configured to use relative URLs (`/api`) which should work automatically with Vercel's routing.

## Testing Your Deployment

After deployment, test the following:

1. **Frontend**: Visit your Vercel URL and ensure the app loads
2. **API Health**: Check `https://your-project.vercel.app/api/health`
3. **Client Creation**: Try adding a new client through the CRM interface
4. **Authentication**: Test login functionality
5. **Database**: Verify data is being saved to Supabase

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check that all environment variables are set correctly
   - Ensure your `vercel.json` file is properly configured
   - Check the build logs in the Vercel dashboard

2. **API Not Working**:
   - Verify the API routes are correctly configured in `vercel.json`
   - Check that the server entry point (`api/index.ts`) is properly exporting the app
   - Ensure environment variables are accessible to the backend

3. **CORS Issues**:
   - Update the `CORS_ORIGIN` environment variable
   - Check that your Supabase settings allow your domain

4. **Database Connection Issues**:
   - Verify Supabase credentials are correct
   - Check Supabase network settings
   - Ensure RLS policies are properly configured

### Build Commands

- **Development**: `npm run dev`
- **Build**: `npm run vercel:build`
- **Deploy**: `npm run vercel:deploy`

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to your repository
2. **Supabase Keys**: Use the anon key for frontend and service role key for backend only
3. **CORS**: Configure CORS properly for production
4. **Rate Limiting**: The app includes rate limiting - ensure it's properly configured

## Performance Optimization

1. **Enable Vercel Analytics**: Monitor your app performance
2. **Optimize Images**: Use next-gen formats and proper sizing
3. **Enable Caching**: Configure proper cache headers
4. **Monitor Usage**: Keep an eye on your Vercel usage limits

## Support

If you encounter issues:

1. Check the Vercel deployment logs
2. Review the build output for errors
3. Test locally with production environment variables
4. Consult the Vercel documentation
5. Check the project's GitHub issues

---

**Note**: This deployment configuration supports both frontend and backend in a single Vercel project. The API routes are served from `/api/*` and the frontend assets are served from the root path.