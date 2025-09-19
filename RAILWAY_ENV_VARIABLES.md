# Railway Environment Variables

Copy and paste these environment variables into your Railway project dashboard:

## Required Variables

```
PORT=3003
NODE_ENV=production
```

## Database Configuration (Supabase)

```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Authentication

```
JWT_SECRET=your_secure_jwt_secret
```

## CORS Configuration

```
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173
```

## Optional API Keys (if needed)

```
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
REDIS_URL=your_redis_url
```

## Instructions

1. Go to your Railway project dashboard
2. Navigate to the "Variables" tab
3. Add each variable one by one
4. Replace the placeholder values with your actual values
5. Save and redeploy your application

## Important Notes

- Replace `your-app.vercel.app` in CORS_ORIGINS with your actual Vercel domain
- Generate a strong JWT_SECRET (use a random string generator)
- Get Supabase credentials from your Supabase project dashboard
- Only add API keys that your application actually uses