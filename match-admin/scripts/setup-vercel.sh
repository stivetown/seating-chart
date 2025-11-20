#!/bin/bash
# Setup script for Vercel deployment
# Run this after first deployment to initialize the database

set -e

echo "🚀 Setting up Match Admin database for Vercel..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ Error: DATABASE_URL environment variable is not set"
  echo "Please set it in Vercel Dashboard → Settings → Environment Variables"
  exit 1
fi

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database with initial data..."
npm run db:seed

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Visit your Vercel deployment URL"
echo "2. Login with: admin@freeda.com / admin123"
echo "3. Change the default password in production!"

