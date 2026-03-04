import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

const clientOptions: any = { 
  log: ['error', 'warn'],
  adapter: new PrismaPg({
    pool: new Pool({
      connectionString: process.env.DATABASE_URL,
    }),
  }),
}
const prisma = global.__prisma ?? new PrismaClient(clientOptions)

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma

export default prisma
