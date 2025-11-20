# Quick Deploy to Vercel

## 🚀 5-Minute Deployment Guide

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Phase 1 foundation"
git remote add origin <your-github-repo-url>
git push -u origin main
```

### Step 2: Create Neon Database
1. Go to [neon.tech](https://neon.tech) → Sign up/Login
2. Create new project
3. Copy the **pooled connection string** (looks like: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require`)

### Step 3: Deploy to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Click "Deploy" (settings are auto-detected)

### Step 4: Set Environment Variables
In Vercel Dashboard → Your Project → Settings → Environment Variables:

```
DATABASE_URL=your-neon-pooled-connection-string
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=run-openssl-rand-base64-32
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 5: Initialize Database
After deployment, run locally:

```bash
export DATABASE_URL="your-neon-connection-string"
npx prisma migrate deploy
npm run db:seed
```

Or use the setup script:
```bash
export DATABASE_URL="your-neon-connection-string"
./scripts/setup-vercel.sh
```

### Step 6: Verify
1. Visit your Vercel URL
2. Login: `admin@freeda.com` / `admin123`
3. ✅ Done!

## What's Configured

✅ **Vercel Configuration**
- `vercel.json` with build settings
- `postinstall` script for Prisma generation
- Optimized Prisma client for serverless

✅ **Security**
- Noindex headers on all routes
- robots.txt blocking crawlers
- Security headers configured

✅ **Database**
- Neon PostgreSQL ready
- Connection pooling for serverless
- Multi-tenant schema

✅ **Features**
- Flexible CSV import
- Multi-tenant architecture
- Authentication structure

## Need Help?

- **Detailed Setup**: See [VERCEL_SETUP.md](./VERCEL_SETUP.md)
- **Deployment Checklist**: See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Local Development**: See [GETTING_STARTED.md](./GETTING_STARTED.md)

## Next Steps

After successful deployment:
1. Test CSV import functionality
2. Verify security headers
3. Begin Phase 2: Matching algorithm UI

