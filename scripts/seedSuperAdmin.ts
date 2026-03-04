import prisma from '../src/config/database'
import bcrypt from 'bcrypt'
import * as crypto from 'crypto'

async function seedSuperAdmin() {
  const email = process.env.SUPER_ADMIN_EMAIL || 'admin@paycher.com'

  const existing = await prisma.admin.findUnique({ where: { email } })
  if (existing) {
    console.log('✅ Super admin already exists:', email)
    return
  }

  const password = process.env.SUPER_ADMIN_PASSWORD || crypto.randomBytes(12).toString('hex')
  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.admin.create({ data: { email, passwordHash, name: 'Super Admin', role: 'SUPER_ADMIN' } })

  console.log('\n🎉 Super admin created successfully!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Email:', email)
  console.log('Password:', password)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n⚠️  IMPORTANT: Save this password securely!')
}

seedSuperAdmin()
  .catch((err) => {
    console.error('Error seeding super admin:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
