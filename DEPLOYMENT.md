# Deployment Guide

Complete setup guide for deploying the Prologue Cyclocross website with automated CI/CD pipeline.

## 🚀 Quick Deployment Setup

### 1. GitHub Repository Configuration

**Required GitHub Secrets** (Repository → Settings → Secrets and variables → Actions):

```
FTP_SERVER     = ftp.yourdomain.com
FTP_USERNAME   = your_ftp_username
FTP_PASSWORD   = your_ftp_password
```

### 2. Namecheap Hosting Setup

**Get FTP Credentials:**

1. Login to Namecheap account
2. Account Panel → Hosting List → Manage
3. Find FTP details section
4. Note hostname, username, and password

**Update Configuration** (if needed):
Edit `scripts/deploy.js` with your FTP details:

```javascript
production: {
  host: 'ftp.yourdomain.com',           // Your FTP host
  username: 'yourdomain_username',      // Your FTP username
  path: '/public_html',                 // Upload path
  protocol: 'ftp'
}
```

## 🔄 Automated Workflow

### Current CI/CD Pipeline

The deployment is **fully automated** via GitHub Actions:

```mermaid
Developer → Git Push → GitHub Actions → Tests → Deploy → Production
```

**Triggered by:**

- Push to `master` branch
- Pull request creation
- Manual workflow dispatch

**Pipeline Steps:**

1. **Test Suite** - Run all 101 tests across 11 suites
2. **Code Quality** - ESLint and Prettier checks
3. **Build Verification** - Ensure clean build
4. **FTP Deployment** - Upload to production server

### Pre-commit Quality Gates

- **Husky hooks** run tests on staged files
- **Lint-staged** formats and lints code
- **Quality checks** prevent low-quality commits

## 🧪 Testing Deployment

### Local Testing

```bash
# Set environment variable (Windows PowerShell)
$env:FTP_PASSWORD = 'your-password'

# Set environment variable (Mac/Linux)
export FTP_PASSWORD='your-password'

# Test deployment
npm run deploy:production
```

### Verify Pipeline

1. Make a small change to codebase
2. Commit and push to GitHub
3. Monitor GitHub Actions tab for deployment status
4. Check production site for updates

## 📋 Deployment Commands

```bash
# Development deployment (staging)
npm run deploy

# Production deployment (requires FTP_PASSWORD env var)
npm run deploy:production

# Test production deployment
npm run deploy:test

# View deployment logs
# Check GitHub Actions tab in repository
```

## 🛡️ Security & Best Practices

### Security Measures

- **Never commit credentials** to repository
- **Use GitHub Secrets** for all sensitive data
- **Environment variables** for local testing only
- **FTP over TLS** when supported by hosting provider

### File Deployment Strategy

- **Incremental updates** - only changed files uploaded
- **No file deletion** - existing files preserved
- **Atomic deployment** - complete upload or rollback
- **Build verification** before deployment

## 🔧 Troubleshooting

### Common Issues

**FTP Connection Fails:**

- Verify FTP credentials in GitHub Secrets
- Check network/firewall FTP access (port 21)
- Confirm hosting provider FTP status

**GitHub Actions Failure:**

- Check Actions tab for detailed error logs
- Verify all required secrets are configured
- Ensure tests pass locally before pushing

**Deployment Partial/Failed:**

- Review FTP deployment logs in Actions
- Check file permissions on hosting server
- Verify available disk space on hosting

**Local Testing Issues:**

- Ensure `FTP_PASSWORD` environment variable is set
- Check FTP credentials match production
- Verify network connectivity to FTP server

### Debug Commands

```bash
# View detailed deployment logs
npm run deploy:production --verbose

# Test FTP connection only
node scripts/deploy.js production --test

# Run quality checks locally
npm run quality
```

## 📊 Deployment Status

**✅ Current State:**

- Fully automated CI/CD pipeline operational
- GitHub Actions configured and tested
- Pre-commit hooks enforcing quality standards
- Production deployment working reliably
- Zero manual deployment steps required

**📈 Deployment Metrics:**

- **Build Time**: < 30 seconds for dev builds
- **Test Execution**: 101 tests in ~10 seconds
- **Deployment Speed**: FTP upload based on changed files
- **Success Rate**: 100% for quality-passing commits

---

**The deployment pipeline is production-ready with automated testing, quality gates, and reliable FTP deployment to Namecheap hosting.**
