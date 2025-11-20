# Match Admin - Whitelabel Matchmaking Admin Platform

A secure, multi-tenant admin platform for matchmaking services. Built for scalability and flexibility across different client data schemas.

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL

# Initialize database
npx prisma generate
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

### Vercel Deployment

See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for complete deployment instructions.

**Quick deploy:**
1. Push to GitHub
2. Import to Vercel
3. Set environment variables in Vercel Dashboard
4. Run database migrations: `npx prisma migrate deploy`
5. Seed database: `npm run db:seed`

## Architecture Overview

### Multi-Tenant Design
- **Tenant isolation**: Each client (Freeda, etc.) has isolated data
- **Client-specific configuration**: Styling, features, and data schemas per tenant
- **Shared infrastructure**: Single codebase, multi-tenant database

### Security First
- No search engine indexing (noindex meta tags, robots.txt)
- Security headers to prevent LLM crawling
- Row-level security in database
- Authentication required for all routes

### Flexible Data Schema
- Dynamic column mapping for CSV imports
- Schema-agnostic member attributes
- No hardcoded field dependencies

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Neon) with Prisma ORM
- **Deployment**: Vercel (serverless)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS (client-customizable)

## Development Phases

### ✅ Phase 1: Foundation (COMPLETE)
- Multi-tenant database schema
- Authentication & security
- Basic admin UI structure
- CSV import with flexible mapping
- **Vercel deployment configured**

### 🚧 Phase 2: Core Matching (Next)
- Matching algorithm
- Weight configuration UI
- Group generation

### 📋 Phase 3: Group Management
- Group viewing/editing
- Member movement
- Fit score visualization

### 🎯 Phase 4: Advanced Features
- Recommendations engine
- History tracking & undo/redo

## Project Structure

```
match-admin/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── import/        # CSV import endpoints
│   ├── login/             # Authentication pages
│   └── layout.tsx         # Root layout with security headers
├── lib/                    # Shared utilities
│   ├── csv-import.ts      # Flexible CSV parsing
│   ├── matching.ts        # Matching algorithm
│   └── prisma.ts          # Database client (Vercel-optimized)
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
├── vercel.json            # Vercel configuration
└── README.md
```

## Key Features

### CSV Import
- Automatic column detection
- Flexible column mapping
- Handles varying CSV structures
- Import tracking and error handling

### Multi-Tenant
- Isolated data per client
- Client-specific configuration
- Ready for subdomain routing

### Security
- No search engine indexing
- Security headers configured
- Authentication required
- Row-level database security

## Environment Variables

```bash
DATABASE_URL=postgresql://...          # Neon PostgreSQL connection string (use pooled)
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secret-key
```

## Default Credentials

After seeding:
- Email: `admin@freeda.com`
- Password: `admin123`

**⚠️ Change these in production!**

## Documentation

- [GETTING_STARTED.md](./GETTING_STARTED.md) - Local setup guide
- [VERCEL_SETUP.md](./VERCEL_SETUP.md) - Vercel deployment guide
- [PHASES.md](./PHASES.md) - Development phases
- [PRODUCT_STRATEGY.md](./PRODUCT_STRATEGY.md) - Product management strategy

## License

Private - All rights reserved
