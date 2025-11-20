# Vercel Deployment Checklist

Use this checklist to ensure a smooth deployment to Vercel.

## Pre-Deployment

### 1. Code Preparation
- [ ] All code committed to Git
- [ ] Pushed to GitHub repository
- [ ] No sensitive data in code (use environment variables)
- [ ] `.env` files in `.gitignore`

### 2. Database Setup
- [ ] Neon PostgreSQL database created
- [ ] Connection string copied (use **pooled** connection for serverless)
- [ ] Database is accessible from internet (Neon handles this)

### 3. Environment Variables Prepared
- [ ] `DATABASE_URL` - Neon pooled connection string
- [ ] `NEXTAUTH_URL` - Your Vercel deployment URL (update after first deploy)
- [ ] `NEXTAUTH_SECRET` - Generated with `openssl rand -base64 32`

## Vercel Deployment

### 4. Create Vercel Project
- [ ] Go to [vercel.com/new](https://vercel.com/new)
- [ ] Import GitHub repository
- [ ] Framework preset: Next.js (auto-detected)
- [ ] Root directory: `./` (default)
- [ ] Build command: `prisma generate && next build` (auto-detected)
- [ ] Deploy project

### 5. Configure Environment Variables
In Vercel Dashboard → Settings → Environment Variables:
- [ ] Add `DATABASE_URL` (pooled connection string)
- [ ] Add `NEXTAUTH_URL` (your Vercel URL, e.g., `https://your-project.vercel.app`)
- [ ] Add `NEXTAUTH_SECRET` (generated secret)
- [ ] Set for all environments (Production, Preview, Development)

### 6. Database Migration
After first deployment:
- [ ] Set `DATABASE_URL` locally: `export DATABASE_URL="your-neon-connection-string"`
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Seed database: `npm run db:seed`

Or use the setup script:
```bash
export DATABASE_URL="your-neon-connection-string"
./scripts/setup-vercel.sh
```

## Post-Deployment

### 7. Verify Deployment
- [ ] Visit deployment URL
- [ ] Check login page loads
- [ ] Verify security headers (use browser dev tools → Network → Response Headers)
  - [ ] `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
- [ ] Check `robots.txt` at `/robots.txt` (should disallow all)
- [ ] Test login with seeded credentials

### 8. Security Verification
- [ ] No data exposed in public routes
- [ ] Authentication required for admin routes
- [ ] Environment variables not exposed in client code
- [ ] Database uses SSL connections

### 9. Functionality Testing
- [ ] CSV import endpoint accessible
- [ ] Database queries working
- [ ] No console errors in browser
- [ ] Vercel function logs show no errors

### 10. Production Hardening
- [ ] Change default admin password
- [ ] Review and update `NEXTAUTH_SECRET` if needed
- [ ] Set up custom domain (optional)
- [ ] Configure Vercel Analytics (optional)
- [ ] Set up error monitoring (optional)

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Verify `package.json` has all dependencies
- Ensure `postinstall` script runs `prisma generate`

### Database Connection Errors
- Verify using **pooled** connection string (not direct)
- Check `DATABASE_URL` is set in Vercel
- Ensure SSL is enabled (`?sslmode=require`)

### Function Timeout
- Check Neon connection pool settings
- Verify database indexes are created
- Review query performance

## Quick Reference

### Neon Connection String Format
```
postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require
```

### Generate NEXTAUTH_SECRET
```bash
openssl rand -base64 32
```

### Run Migrations Locally
```bash
export DATABASE_URL="your-neon-connection-string"
npx prisma migrate deploy
npm run db:seed
```

### Check Vercel Logs
```bash
vercel logs
```

## Next Steps After Deployment

1. ✅ Test CSV import with sample data
2. ✅ Verify multi-tenant isolation
3. ✅ Begin Phase 2 development
4. ✅ Set up monitoring and alerts

