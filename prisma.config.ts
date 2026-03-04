import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Use process.env here to avoid failing commands like `prisma generate`
// when DATABASE_URL isn't defined (use env() from prisma/config to enforce presence).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
})
