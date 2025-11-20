# Getting Started

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

1. Create a Neon PostgreSQL database (or use any PostgreSQL instance)
2. Copy `.env.example` to `.env` and fill in your `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### 3. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npm run db:push

# Seed initial data (creates Freeda tenant and admin user)
npm run db:seed
```

### 4. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Default Credentials

After seeding:
- Email: `admin@freeda.com`
- Password: `admin123`

**⚠️ Change these in production!**

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
│   └── prisma.ts          # Database client
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
└── README.md
```

## Key Features Implemented

### ✅ Phase 1: Foundation
- Multi-tenant database schema
- Security headers (noindex, robots.txt)
- Flexible CSV import system
- Column mapping configuration
- Basic authentication structure

### 🚧 Next: Phase 2
- Matching algorithm UI
- Weight configuration
- Group generation

## CSV Import Workflow

1. Upload CSV file via `/api/import/columns` to detect columns
2. Map CSV columns to member attributes (flexible mapping)
3. Submit import via `/api/import` POST endpoint
4. System processes and stores members with flexible JSON attributes

## Multi-Tenant Architecture

- Each client (like Freeda) is a `Tenant` record
- All data is isolated by `tenantId`
- Client-specific config stored in `Tenant.config` JSON field
- Future: Subdomain routing for each tenant

## Security

- All routes have `X-Robots-Tag: noindex` header
- `robots.txt` disallows all crawlers
- Authentication required for all admin routes
- Row-level security via tenant isolation

## Development Tips

- Use `npm run db:studio` to view database in Prisma Studio
- Check `PHASES.md` for development roadmap
- All member data stored as JSON for maximum flexibility

