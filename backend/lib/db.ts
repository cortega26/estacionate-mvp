import { PrismaClient } from '@prisma/client'
export * from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Best Practice: In serverless environments (like Vercel), use a connection pooler 
// (e.g., Supabase Transaction Pool, PgBouncer) for DATABASE_URL to prevent 
// exhausting connection limits during traffic spikes or high concurrency.
export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
