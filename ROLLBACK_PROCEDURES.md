# Rollback Procedures Documentation

## 🔄 Emergency Rollback Guide

### Overview
This document provides step-by-step procedures for rolling back deployments and recovering data in case of deployment failures or issues.

## 🚨 When to Rollback

### Immediate Rollback Scenarios:
- **Application won't start** after deployment
- **Database connection failures** in production
- **Critical functionality broken** (auth, payments, core features)
- **Data corruption detected** in production
- **Security vulnerabilities** discovered
- **Performance degradation** > 50%

### Assessment Before Rollback:
1. **Identify the scope** of the issue
2. **Check if it's a quick fix** vs full rollback
3. **Assess data integrity** impact
4. **Consider user impact** and downtime

## 🛠️ Rollback Procedures

### 1. Frontend Rollback (Vercel)

#### Quick Rollback via Vercel Dashboard:
1. **Go to Vercel Dashboard** → Your Project → Deployments
2. **Find the last working deployment**
3. **Click "Promote to Production"**
4. **Verify rollback** by testing the site

#### Rollback via Vercel CLI:
```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]

# Or rollback to previous deployment
vercel rollback --previous
```

#### Manual Rollback (Git-based):
```bash
# Find the last working commit
git log --oneline -10

# Create rollback branch
git checkout -b rollback-emergency

# Reset to working commit
git reset --hard [working-commit-hash]

# Force push (be careful!)
git push origin rollback-emergency --force

# Deploy the rollback branch
vercel --prod
```

### 2. Backend Rollback (Railway)

#### Quick Rollback via Railway Dashboard:
1. **Go to Railway Dashboard** → Your Project → Deployments
2. **Find the last working deployment**
3. **Click "Redeploy"** on that version
4. **Monitor deployment logs**

#### Rollback via Railway CLI:
```bash
# List deployments
railway status

# Rollback to previous deployment
railway rollback

# Or specify deployment ID
railway rollback [deployment-id]
```

#### Manual Backend Rollback:
```bash
# Stop current deployment
railway down

# Checkout working version
git checkout [working-commit-hash]

# Redeploy
railway up
```

### 3. Database Rollback (Supabase)

⚠️ **CRITICAL**: Database rollbacks are more complex and risky!

#### Option A: Restore from Backup (Recommended)
```bash
# 1. Stop all write operations first
# 2. Create current state backup (just in case)
node scripts/backup-database.js

# 3. Restore from known good backup
node scripts/restore-database.js

# 4. Verify data integrity
node scripts/validate-data.js
```

#### Option B: Migration Rollback (Advanced)
```sql
-- Only if you have reversible migrations
-- Example: Rolling back a column addition
ALTER TABLE clients DROP COLUMN IF EXISTS new_column;

-- Rolling back RLS policy changes
DROP POLICY IF EXISTS new_policy_name ON table_name;
```

#### Option C: Point-in-Time Recovery (Supabase Pro)
1. **Go to Supabase Dashboard** → Database → Backups
2. **Select point-in-time** before the issue
3. **Restore database** (this will replace current data!)
4. **Update connection strings** if needed

## 🔍 Rollback Verification

### Post-Rollback Checklist:

#### 1. Application Health
- [ ] **Frontend loads** without errors
- [ ] **Backend health endpoint** responds
  ```bash
  curl https://your-app.railway.app/api/health
  ```
- [ ] **Database connection** is working
- [ ] **Authentication** is functional

#### 2. Core Functionality
- [ ] **User login/logout** works
- [ ] **CRUD operations** function properly
- [ ] **File uploads** are working
- [ ] **Real-time features** are active
- [ ] **API endpoints** respond correctly

#### 3. Data Integrity
- [ ] **User data** is intact
- [ ] **Client records** are complete
- [ ] **Chat messages** are preserved
- [ ] **File attachments** are accessible
- [ ] **Relationships** between data are correct

### Verification Scripts:
```bash
# Test API endpoints
curl -X GET https://your-app.railway.app/api/crm/clients
curl -X GET https://your-app.railway.app/api/auth/me

# Test database connectivity
node scripts/validate-data.js

# Check frontend functionality
# (Manual testing in browser)
```

## 📋 Rollback Decision Matrix

| Issue Type | Frontend Rollback | Backend Rollback | Database Rollback | Urgency |
|------------|------------------|------------------|-------------------|----------|
| UI Bug | ✅ Yes | ❌ No | ❌ No | Medium |
| API Error | ❌ No | ✅ Yes | ❌ No | High |
| Auth Issues | ✅ Maybe | ✅ Yes | ❌ No | High |
| Data Corruption | ❌ No | ❌ No | ✅ Yes | Critical |
| Performance | ✅ Maybe | ✅ Yes | ❌ No | Medium |
| Security Issue | ✅ Yes | ✅ Yes | ✅ Maybe | Critical |

## 🚨 Emergency Contacts & Procedures

### Escalation Path:
1. **Developer** (immediate response)
2. **Team Lead** (if developer unavailable)
3. **System Admin** (for infrastructure issues)
4. **Database Admin** (for data issues)

### Communication During Rollback:
```markdown
# Emergency Rollback Notification Template

🚨 **EMERGENCY ROLLBACK IN PROGRESS**

**Issue**: [Brief description]
**Affected Systems**: [Frontend/Backend/Database]
**Started At**: [Timestamp]
**ETA**: [Estimated completion time]
**Status**: [In Progress/Completed/Failed]

**Actions Taken**:
- [ ] Frontend rollback
- [ ] Backend rollback  
- [ ] Database restore
- [ ] Verification complete

**Next Steps**: [What happens next]
```

## 🔧 Rollback Tools & Scripts

### Quick Rollback Script
Create `scripts/emergency-rollback.js`:
```javascript
#!/usr/bin/env node

const { execSync } = require('child_process');

function emergencyRollback(type) {
  console.log(`🚨 Starting emergency ${type} rollback...`);
  
  try {
    switch(type) {
      case 'frontend':
        console.log('Rolling back frontend...');
        execSync('vercel rollback --previous', { stdio: 'inherit' });
        break;
        
      case 'backend':
        console.log('Rolling back backend...');
        execSync('railway rollback', { stdio: 'inherit' });
        break;
        
      case 'database':
        console.log('Restoring database from backup...');
        execSync('node scripts/restore-database.js', { stdio: 'inherit' });
        break;
        
      case 'full':
        console.log('Full system rollback...');
        execSync('vercel rollback --previous', { stdio: 'inherit' });
        execSync('railway rollback', { stdio: 'inherit' });
        console.log('⚠️  Database rollback requires manual confirmation');
        break;
        
      default:
        console.error('Invalid rollback type. Use: frontend, backend, database, or full');
        process.exit(1);
    }
    
    console.log('✅ Rollback completed successfully!');
    console.log('🔍 Please verify system functionality');
    
  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    console.log('📞 Contact system administrator immediately');
    process.exit(1);
  }
}

// Usage: node scripts/emergency-rollback.js [frontend|backend|database|full]
const type = process.argv[2];
if (!type) {
  console.log('Usage: node scripts/emergency-rollback.js [frontend|backend|database|full]');
  process.exit(1);
}

emergencyRollback(type);
```

### Usage:
```bash
# Rollback frontend only
node scripts/emergency-rollback.js frontend

# Rollback backend only
node scripts/emergency-rollback.js backend

# Rollback database (with confirmation)
node scripts/emergency-rollback.js database

# Full system rollback
node scripts/emergency-rollback.js full
```

## 📚 Prevention Strategies

### To Minimize Rollback Needs:
1. **Staging Environment** - Test everything first
2. **Feature Flags** - Enable/disable features without deployment
3. **Blue-Green Deployment** - Zero-downtime deployments
4. **Automated Testing** - Catch issues before production
5. **Monitoring & Alerts** - Detect issues quickly
6. **Regular Backups** - Always have a recovery point

### Rollback-Friendly Practices:
- **Small, incremental deployments**
- **Backward-compatible database changes**
- **Environment variable management**
- **Proper version tagging**
- **Documentation of changes**

## 🔗 Quick Reference Commands

```bash
# Emergency rollback commands
vercel rollback --previous
railway rollback
node scripts/restore-database.js

# Health checks
curl https://your-app.railway.app/api/health
node scripts/validate-data.js

# Backup before rollback
node scripts/backup-database.js
```

---

**Remember: Rollbacks are emergency procedures. Always verify the system is working correctly after a rollback and investigate the root cause to prevent future issues.**