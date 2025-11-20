# Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Neon Database**: Create a Neon PostgreSQL database at [neon.tech](https://neon.tech)
3. **GitHub Repository**: Push this code to GitHub (Vercel auto-deploys from GitHub)

## Step 1: Set Up Neon Database

1. Go to [neon.tech](https://neon.tech) and create an account
2. Create a new project
3. Copy your connection string (it will look like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)
4. **Important**: For Vercel serverless, use the **pooled connection string** (not the direct connection)
   - In Neon dashboard, look for "Connection pooling" section
   - Use the connection string that includes `?pgbouncer=true` or use the pooled endpoint

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `prisma generate && next build` (auto-detected)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install` (default)

### Option B: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

## Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

### Required Variables

```
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true
NEXTAUTH_URL=https://your-project.vercel.app
NEXTAUTH_SECRET=your-secret-key-here
```

### How to Generate NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Environment-Specific Variables

You can set different values for:
- **Production**: Production deployments
- **Preview**: Preview deployments (PRs)
- **Development**: Local development (optional)

## Step 4: Run Database Migrations

After first deployment, you need to set up the database schema:

### Option A: Using Vercel CLI (Recommended)

```bash
# Set DATABASE_URL in your local .env
echo "DATABASE_URL=your-neon-connection-string" > .env

# Run migrations
npx prisma migrate deploy

# Seed the database
npm run db:seed
```

### Option B: Using Prisma Studio (Alternative)

```bash
# Run Prisma Studio locally with production DATABASE_URL
DATABASE_URL=your-neon-connection-string npx prisma studio
```

Then manually create the Freeda tenant and admin user.

## Step 5: Verify Deployment

1. Visit your Vercel deployment URL
2. You should see the login page
3. Test the deployment:
   - Check that security headers are present (use browser dev tools)
   - Verify robots.txt is accessible at `/robots.txt`
   - Test login (after seeding database)

## Step 6: Set Up Custom Domain (Optional)

1. In Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` environment variable to match your domain

## Neon Connection Pooling for Serverless

Neon provides connection pooling specifically for serverless environments. The Prisma client is configured to work optimally with Neon's pooled connections.

**Important**: Always use the pooled connection string in Vercel, not the direct connection string.

### Connection String Format

```
postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require&pgbouncer=true
```

Or use Neon's pooled endpoint:
```
postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require
```

## Troubleshooting

### Build Fails: "Prisma Client not generated"

**Solution**: The `postinstall` script should handle this, but if it fails:
1. Check that `prisma generate` runs during build
2. Verify `package.json` has `"postinstall": "prisma generate"`

### Database Connection Errors

**Solution**: 
1. Verify you're using the pooled connection string (not direct)
2. Check that `DATABASE_URL` is set in Vercel environment variables
3. Ensure SSL is enabled (`?sslmode=require`)

### "Module not found" Errors

**Solution**:
1. Ensure all dependencies are in `package.json` (not just `devDependencies`)
2. Check that `node_modules` is not in `.gitignore` incorrectly

### Slow Database Queries

**Solution**:
1. Ensure you're using Neon's connection pooling
2. Check database indexes are created (run `prisma migrate deploy`)
3. Monitor Neon dashboard for connection pool usage

## Continuous Deployment

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

Each deployment:
1. Runs `npm install` (which runs `prisma generate` via postinstall)
2. Runs `prisma generate && next build`
3. Deploys to Vercel's edge network

## Database Migrations in Production

For production migrations:

```bash
# Set production DATABASE_URL locally
export DATABASE_URL="your-production-connection-string"

# Run migrations
npx prisma migrate deploy
```

Or use Vercel's build command to run migrations automatically (not recommended for production).

## Monitoring

- **Vercel Analytics**: Built-in performance monitoring
- **Neon Dashboard**: Database connection and query monitoring
- **Vercel Logs**: Function logs and errors

## Security Checklist

- ✅ Security headers configured (noindex, etc.)
- ✅ robots.txt blocks all crawlers
- ✅ Environment variables secured in Vercel
- ✅ Database uses SSL connections
- ✅ Authentication required for admin routes

## Next Steps

After successful deployment:
1. Seed the database with Freeda tenant
2. Test CSV import functionality
3. Begin Phase 2 development

