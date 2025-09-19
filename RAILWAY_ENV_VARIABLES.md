# Railway Environment Variables

Copy and paste these environment variables into your Railway project dashboard:

## Required Variables

```
PORT=3004
NODE_ENV=production
```

## Database Configuration (Supabase)

```
SUPABASE_URL=https://wetixgvebtoelgaxyuez.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldGl4Z3ZlYnRvZWxnYXh5dWV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMzcxMzUsImV4cCI6MjA3MzcxMzEzNX0.af8RxfXMQc1GQQgVzsJrCECLYrjlZe4SwjW4xI1rqXs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndldGl4Z3ZlYnRvZWxnYXh5dWV6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODEzNzEzNSwiZXhwIjoyMDczNzEzMTM1fQ.tyY-SrkUPDYVBp3VrYGDWzoD0mOb8CT-asRVnfLDBtw
```

## Authentication

```
JWT_SECRET=your_jwt_secret_key_here_generate_a_random_string
```

## CORS Configuration

```
CORS_ORIGIN=https://empty-crm-application-personal-phwra6dzj-inkcansaylot.vercel.app,http://localhost:5173
```

## API Keys

```
OPENROUTER_API_KEY=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
REDIS_URL=redis://localhost:6379
```

## Rate Limiting

```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Default Admin Credentials

```
DEFAULT_ADMIN_EMAIL=admin@emptyad.com
DEFAULT_ADMIN_PASSWORD=emptyad123
```

## Email Configuration (Optional)

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@emptyad.com
FROM_NAME=Empty AD
```

## Instructions

1. Go to your Railway project dashboard
2. Navigate to the "Variables" tab
3. Add each variable one by one
4. Replace the placeholder values with your actual values
5. Save and redeploy your application

## Important Notes

- CORS_ORIGIN has been updated with the current Vercel deployment URL
- Generate a strong JWT_SECRET for production (current one is for development)
- Supabase credentials are already configured from your project
- Update SMTP credentials if you want to enable email functionality
- Default admin credentials are for initial setup - change them after first login