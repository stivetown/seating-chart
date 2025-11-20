import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Optimized for Vercel serverless functions
// Uses connection pooling for Neon PostgreSQL
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Optimize for serverless: reduce connection pool size
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

// In development, reuse the same instance
// In production (Vercel), each serverless function gets its own instance
// but Prisma handles connection pooling automatically with Neon
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

