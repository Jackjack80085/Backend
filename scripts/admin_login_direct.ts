import 'dotenv/config'
import { Client } from 'pg'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

async function main() {
  const email = process.env.TEST_ADMIN_EMAIL || 'admin@paycher.com'
  const password = process.env.TEST_ADMIN_PASSWORD || ''
  if (!password) {
    console.error('Provide TEST_ADMIN_PASSWORD env var or set password in script')
    process.exit(1)
  }

  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.error('DATABASE_URL not set')
    process.exit(1)
  }

  const client = new Client({ connectionString: databaseUrl })
  await client.connect()

  const res = await client.query('SELECT id, "passwordHash", email, role FROM admins WHERE email = $1', [email])
  if (res.rowCount === 0) {
    console.error('Admin not found')
    await client.end()
    process.exit(1)
  }

  const row = res.rows[0]
  console.log('DB row keys:', Object.keys(row))
  console.log('DB row preview:', row)
  const hash = row.passwordhash ?? row.passwordHash ?? row.password_hash
  const ok = await bcrypt.compare(password, hash)
  if (!ok) {
    console.error('Invalid credentials')
    await client.end()
    process.exit(1)
  }

  const payload = { adminId: row.id, email: row.email, role: row.role }
  const secret = process.env.JWT_SECRET || ''
  if (!secret) {
    console.error('JWT_SECRET not set')
    await client.end()
    process.exit(1)
  }

  const token = jwt.sign(payload as any, secret as any, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' } as any)
  console.log(JSON.stringify({ success: true, token, admin: payload }, null, 2))

  await client.end()
}

main().catch((err) => {
  console.error('Error:', err)
  process.exit(1)
})
