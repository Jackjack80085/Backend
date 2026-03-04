import * as fs from 'fs'
import * as path from 'path'
import bcrypt from 'bcrypt'
import * as crypto from 'crypto'

async function main() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@paycher.com'
  const password = process.env.SUPER_ADMIN_PASSWORD || crypto.randomBytes(12).toString('hex')
  const passwordHash = await bcrypt.hash(password, 12)
  const id = crypto.randomUUID()

  const sql = `INSERT INTO "admins" (id, email, "passwordHash", name, role, "isActive", "createdAt", "updatedAt") VALUES ('${id}', '${email.replace("'","''")}', '${passwordHash.replace("'","''")}', 'Super Admin', 'SUPER_ADMIN', true, now(), now());` + '\n'

  const tmpDir = path.join(process.cwd(), 'prisma')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })
  const filePath = path.join(tmpDir, 'tmp_seed_admin.sql')
  fs.writeFileSync(filePath, sql, { encoding: 'utf8' })

  console.log('\nWrote seed SQL to', filePath)
  console.log('Super admin email:', email)
  console.log('Super admin password (save this):', password)
  console.log('\nNow run: npx prisma db execute --file', filePath)
}

main().catch((err) => {
  console.error('Failed to prepare seed SQL:', err)
  process.exit(1)
})
