# Deployment Guide

This guide provides step-by-step instructions for deploying the CRM Personal application with the frontend on Vercel and the backend on Railway.

## Prerequisites

- GitHub account
- Vercel account (free tier available)
- Railway account (free tier available)
- Supabase project (if using database features)
- Environment variables configured

## Backend Deployment (Railway)

### Step 1: Prepare Your Repository

1. Ensure your code is pushed to a GitHub repository
2. Verify that `railway.toml` and `Procfile` are in your project root
3. Confirm `package.json` has the correct start script:
   ```json
   {
     "scripts": {
       "start": "tsx api/server.ts"
     }
   }
   ```

### Step 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app) and sign in
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway will automatically detect your Node.js project

### Step 3: Configure Environment Variables

In your Railway project dashboard, go to Variables and add:

```bash
# Server Configuration
PORT=3003
NODE_ENV=production

# Database (if using Supabase)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret
JWT_SECRET=your_secure_jwt_secret

# CORS Origins (include your Vercel domain)
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173

# API Keys (if needed)
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Redis (if using)
REDIS_URL=your_redis_url
```

### Step 4: Deploy and Get URL

1. Railway will automatically deploy your application
2. Once deployed, copy your Railway app URL (e.g., `https://your-app.up.railway.app`)
3. Test your API endpoints to ensure they're working

## Frontend Deployment (Vercel)

### Step 1: Configure Environment Variables

Create a `.env.local` file in your project root (for local development) and configure the following in Vercel:

```bash
# API Configuration
VITE_API_BASE_URL=https://your-app.up.railway.app/api

# Supabase (if using)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Other API Keys (if needed for frontend)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Step 2: Deploy to Vercel

#### Option A: Vercel CLI (Recommended)

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts and configure your project

#### Option B: Vercel Dashboard

1. Go to [Vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Configure Environment Variables in Vercel

1. In your Vercel project dashboard, go to Settings → Environment Variables
2. Add all the environment variables from Step 1
3. Make sure to set them for Production, Preview, and Development environments

### Step 4: Update CORS Configuration

1. Once you have your Vercel URL, update your Railway backend environment variables:
   ```bash
   CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5173
   ```

2. Redeploy your Railway backend to apply the CORS changes

## Database Setup (Supabase)

If you're using Supabase for your database:

### Step 1: Create Supabase Project

1. Go to [Supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready
3. Go to Settings → API to get your keys

### Step 2: Run Migrations

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login and link your project:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```

3. Push your schema:
   ```bash
   supabase db push
   ```

### Step 3: Configure Row Level Security

1. In your Supabase dashboard, go to Authentication → Policies
2. Enable RLS on your tables
3. Create appropriate policies for your application

## Post-Deployment Checklist

### Backend (Railway)
- [ ] API endpoints are accessible
- [ ] Environment variables are set correctly
- [ ] Database connections are working
- [ ] CORS is configured for your frontend domain
- [ ] Logs show no critical errors

### Frontend (Vercel)
- [ ] Application loads correctly
- [ ] API calls to Railway backend work
- [ ] Environment variables are set
- [ ] PWA features work (offline, installable)
- [ ] All routes work correctly (SPA routing)

### Testing
- [ ] Test user registration/login
- [ ] Test CRUD operations
- [ ] Test file uploads (if applicable)
- [ ] Test on mobile devices
- [ ] Test PWA installation

## Troubleshooting

### Common Issues

#### CORS Errors
- Ensure your Vercel domain is added to `CORS_ORIGINS` in Railway
- Check that the backend CORS middleware is properly configured

#### API Connection Issues
- Verify `VITE_API_BASE_URL` points to your Railway URL
- Ensure Railway backend is running and accessible
- Check Railway logs for errors

#### Build Failures
- Check that all dependencies are in `package.json`
- Verify build commands are correct
- Check for TypeScript errors

#### Environment Variables
- Ensure all required variables are set in both platforms
- Check variable names match exactly (case-sensitive)
- Verify no trailing spaces or quotes

### Useful Commands

```bash
# Check Railway logs
railway logs

# Check Vercel deployment logs
vercel logs

# Test API endpoints
curl https://your-app.up.railway.app/api/health

# Local development with production API
VITE_API_BASE_URL=https://your-app.up.railway.app/api npm run dev
```

## Monitoring and Maintenance

### Railway
- Monitor resource usage in Railway dashboard
- Set up alerts for downtime
- Regularly check logs for errors

### Vercel
- Monitor build times and deployment frequency
- Check Core Web Vitals in Vercel Analytics
- Monitor function execution (if using Vercel Functions)

### Database (Supabase)
- Monitor database size and usage
- Regularly backup your data
- Keep track of API usage limits

## Security Considerations

- Never commit `.env` files to version control
- Use strong, unique JWT secrets
- Regularly rotate API keys
- Enable HTTPS only in production
- Configure proper CORS origins
- Use environment-specific configurations
- Enable database Row Level Security
- Regularly update dependencies

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Railway and Vercel documentation
3. Check application logs for specific error messages
4. Verify all environment variables are correctly set

---

**Note**: Replace all placeholder URLs and keys with your actual values. Keep your environment variables secure and never share them publicly.