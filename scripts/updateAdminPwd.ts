import prisma from '../src/config/database'
import bcrypt from 'bcrypt'

async function run() {
  const hash = await bcrypt.hash('AdminPaycher2024', 12)
  const r = await prisma.admin.update({
    where: { email: 'admin@paycher.com' },
    data: { passwordHash: hash }
  })
  console.log('Updated admin:', r.email)
  const admin = await prisma.admin.findUnique({ where: { email: 'admin@paycher.com' }})
  if (admin) {
    const ok = await bcrypt.compare('AdminPaycher2024', admin.passwordHash)
    console.log('Password verify:', ok ? 'OK' : 'FAIL')
  }
  await prisma.$disconnect()
}
run().catch(e => { console.error(e.message); process.exit(1) })
