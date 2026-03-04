import { PrismaClient } from '@prisma/client'

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

const clientOptions: any = { log: ['error', 'warn'] }
const prisma = global.__prisma ?? new PrismaClient(clientOptions)

if (process.env.NODE_ENV !== 'production') global.__prisma = prisma

export default prisma
