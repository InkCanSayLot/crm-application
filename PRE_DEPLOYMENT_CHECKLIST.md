# Pre-Deployment Safety Checklist

## Database Protection Checklist

### 🔒 Pre-Deployment Requirements (MANDATORY)

#### 1. Database Backup
- [ ] **Create full database backup**
  ```bash
  node scripts/backup-database.js
  ```
- [ ] **Verify backup file exists and is not empty**
- [ ] **Test backup integrity** (optional but recommended)
- [ ] **Store backup in secure location** (local + cloud)

#### 2. Environment Variables Verification
- [ ] **Verify all Supabase credentials are correct**
  - [ ] SUPABASE_URL matches production
  - [ ] SUPABASE_ANON_KEY is valid
  - [ ] SUPABASE_SERVICE_ROLE_KEY is secure
- [ ] **Check Railway environment variables**
- [ ] **Ensure no placeholder values** (sk-xxx, your-key-here)

#### 3. Database Schema Safety
- [ ] **Review migration files** in `supabase/migrations/`
- [ ] **Ensure migrations are additive only** (no DROP statements)
- [ ] **Verify RLS policies are preserved**
- [ ] **Check table permissions** for anon/authenticated roles

#### 4. Code Safety Checks
- [ ] **Run build process locally**
  ```bash
  npm run build
  ```
- [ ] **Test API endpoints locally**
  ```bash
  npm run server:dev
  curl http://localhost:3000/api/health
  ```
- [ ] **Verify frontend builds without errors**
  ```bash
  npm run client:build
  ```

### 🚀 Deployment Process

#### 5. Railway Backend Deployment
- [ ] **Deploy backend first** (Railway)
- [ ] **Wait for deployment to complete**
- [ ] **Test health endpoint**
  ```bash
  curl https://your-railway-app.railway.app/api/health
  ```
- [ ] **Verify database connection** in Railway logs

#### 6. Vercel Frontend Deployment
- [ ] **Update environment variables** in Vercel dashboard
- [ ] **Deploy frontend** (Vercel)
- [ ] **Test frontend functionality**

### ✅ Post-Deployment Verification

#### 7. Data Integrity Checks
- [ ] **Verify existing data is intact**
  - [ ] Check user accounts
  - [ ] Verify client records
  - [ ] Test chat messages
  - [ ] Confirm file uploads
- [ ] **Test core functionality**
  - [ ] User authentication
  - [ ] CRUD operations
  - [ ] File uploads
  - [ ] Real-time features

#### 8. Performance Monitoring
- [ ] **Monitor application performance**
- [ ] **Check error logs** in Railway/Vercel
- [ ] **Verify database performance** in Supabase dashboard
- [ ] **Test user workflows** end-to-end

### 🆘 Emergency Procedures

#### If Deployment Fails:
1. **DO NOT PANIC** - your data is safe in Supabase
2. **Check Railway/Vercel logs** for specific errors
3. **Rollback if necessary** using previous deployment
4. **Restore database if needed** (use backup scripts)

#### If Data Issues Occur:
1. **Stop all write operations immediately**
2. **Assess data integrity** using validation scripts
3. **Restore from backup** if corruption detected
   ```bash
   node scripts/restore-database.js
   ```

### 📋 Deployment Commands Reference

```bash
# Pre-deployment backup
node scripts/backup-database.js

# Build verification
npm run build
npm run client:build

# Health checks
curl http://localhost:3000/api/health
curl https://your-app.railway.app/api/health

# Emergency restore
node scripts/restore-database.js
```

### 🔐 Security Reminders

- **Never commit sensitive keys** to version control
- **Use environment variables** for all credentials
- **Verify CORS settings** for production domains
- **Check rate limiting** is properly configured
- **Ensure HTTPS** is enforced in production

---

## ⚠️ CRITICAL SAFETY NOTES

1. **Supabase data is persistent** - Railway/Vercel deployments won't affect your database
2. **Always backup before major changes** - prevention is better than cure
3. **Test in staging first** - if you have a staging environment
4. **Monitor closely** - watch for issues in the first 24 hours
5. **Have rollback plan ready** - know how to revert quickly

**Remember: Your database lives in Supabase, not in Railway/Vercel. Deployment failures won't delete your data, but it's always better to be safe!**