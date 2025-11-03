# Environment Variable Protection Guide

## 🔐 Securing Your Environment Variables During Deployment

### Overview
This guide ensures your sensitive data (API keys, database credentials, secrets) remain secure during deployment while maintaining data persistence.

## 🚨 Critical Security Rules

### 1. Never Commit Secrets
- ❌ **NEVER** commit `.env` files to version control
- ❌ **NEVER** hardcode API keys in source code
- ❌ **NEVER** use placeholder values in production
- ✅ **ALWAYS** use environment variables for sensitive data
- ✅ **ALWAYS** verify `.env` is in `.gitignore`

### 2. Environment Variable Validation

#### Before Deployment Checklist:
```bash
# Check if .env exists and is not committed
ls -la .env
git status | grep -v ".env"

# Verify no placeholder values
grep -E "(sk-xxx|your-.*-here|placeholder|example)" .env
```

#### Required Variables Verification:
```bash
# Database (Supabase)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ... (real key, not placeholder)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (real key, not placeholder)

# Server Configuration
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secure-jwt-secret
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Optional but Recommended
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🛠️ Platform-Specific Setup

### Railway Backend Environment Variables

#### Setting Variables in Railway:
1. **Go to Railway Dashboard** → Your Project → Variables
2. **Add each variable individually:**
   ```
   SUPABASE_URL = https://your-project.supabase.co
   SUPABASE_ANON_KEY = eyJ...
   SUPABASE_SERVICE_ROLE_KEY = eyJ...
   JWT_SECRET = your-secure-jwt-secret
   NODE_ENV = production
   CORS_ORIGIN = https://your-frontend.vercel.app
   ```

#### Railway CLI Method:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Set variables
railway variables set SUPABASE_URL="https://your-project.supabase.co"
railway variables set SUPABASE_ANON_KEY="eyJ..."
railway variables set SUPABASE_SERVICE_ROLE_KEY="eyJ..."
```

### Vercel Frontend Environment Variables

#### Setting Variables in Vercel:
1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables
2. **Add frontend variables:**
   ```
   VITE_SUPABASE_URL = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJ...
   VITE_API_BASE_URL = https://your-backend.railway.app
   ```

#### Vercel CLI Method:
```bash
# Install Vercel CLI
npm install -g vercel

# Login and link project
vercel login
vercel link

# Set variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY
vercel env add VITE_API_BASE_URL
```

## 🔍 Security Validation Scripts

### Environment Variable Checker
Create `scripts/check-env.js`:
```javascript
#!/usr/bin/env node

const requiredVars = {
  backend: [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY', 
    'SUPABASE_SERVICE_ROLE_KEY',
    'JWT_SECRET'
  ],
  frontend: [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_API_BASE_URL'
  ]
};

const dangerousPatterns = [
  /sk-xxx/,
  /your-.*-here/,
  /placeholder/i,
  /example/i,
  /test.*key/i
];

function checkEnvironment(type = 'backend') {
  console.log(`🔍 Checking ${type} environment variables...`);
  
  const vars = requiredVars[type];
  const missing = [];
  const dangerous = [];
  
  vars.forEach(varName => {
    const value = process.env[varName];
    
    if (!value) {
      missing.push(varName);
    } else {
      // Check for dangerous patterns
      dangerousPatterns.forEach(pattern => {
        if (pattern.test(value)) {
          dangerous.push(varName);
        }
      });
    }
  });
  
  if (missing.length > 0) {
    console.error('❌ Missing variables:', missing);
    process.exit(1);
  }
  
  if (dangerous.length > 0) {
    console.error('⚠️  Dangerous placeholder values:', dangerous);
    process.exit(1);
  }
  
  console.log('✅ All environment variables are properly set!');
}

// Usage: node scripts/check-env.js [backend|frontend]
const type = process.argv[2] || 'backend';
checkEnvironment(type);
```

### Usage:
```bash
# Check backend variables
node scripts/check-env.js backend

# Check frontend variables  
node scripts/check-env.js frontend
```

## 🔄 Environment Synchronization

### Keeping Environments in Sync

#### 1. Local → Railway
```bash
# Export local env to Railway
railway variables set $(cat .env | grep -v '^#' | xargs)
```

#### 2. Local → Vercel
```bash
# Set Vercel variables from local .env
while IFS='=' read -r key value; do
  if [[ $key == VITE_* ]]; then
    vercel env add $key production <<< "$value"
  fi
done < .env
```

#### 3. Supabase → Local
```bash
# Get Supabase credentials (manual step)
# 1. Go to Supabase Dashboard → Settings → API
# 2. Copy URL and keys
# 3. Update your .env file
```

## 🛡️ Security Best Practices

### 1. Key Rotation
- **Rotate JWT secrets** periodically
- **Regenerate API keys** if compromised
- **Update all environments** when rotating keys

### 2. Access Control
- **Limit team access** to production variables
- **Use service accounts** for CI/CD
- **Audit variable access** regularly

### 3. Monitoring
- **Monitor for failed authentications**
- **Set up alerts** for suspicious activity
- **Log environment variable usage**

## 🚨 Emergency Procedures

### If Keys Are Compromised:
1. **Immediately rotate** all affected keys
2. **Update all environments** (local, Railway, Vercel)
3. **Check logs** for unauthorized access
4. **Notify team members**

### If Deployment Fails Due to Env Issues:
1. **Check variable names** (case-sensitive)
2. **Verify no trailing spaces** in values
3. **Ensure proper encoding** for special characters
4. **Test locally first** with same variables

## 📋 Pre-Deployment Checklist

- [ ] All required variables are set
- [ ] No placeholder values exist
- [ ] Variables match between environments
- [ ] .env is in .gitignore
- [ ] Keys are properly formatted
- [ ] CORS origins are correct
- [ ] JWT secrets are secure

## 🔗 Quick Reference Commands

```bash
# Validate environment
node scripts/check-env.js

# Check Railway variables
railway variables

# Check Vercel variables
vercel env ls

# Test Supabase connection
curl -H "apikey: $SUPABASE_ANON_KEY" "$SUPABASE_URL/rest/v1/"
```

---

**Remember: Environment variables are the gateway to your data. Protect them like you protect your database!**