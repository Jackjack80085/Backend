import prisma from '../config/database'
import { JobLogger } from '../utils/jobLogger'

export async function cleanupInvitesJob() {
  const logger = new JobLogger('cleanupInvites')

  try {
    logger.log('Cleaning up expired partner invitations...')

    const expiredPartners = await prisma.partner.findMany({
      where: {
        status: 'INVITED',
        inviteExpiresAt: { lt: new Date() },
      },
      select: { id: true, email: true },
    })

    if (expiredPartners.length === 0) {
      logger.log('No expired invitations found')
      logger.complete(0)
      return
    }

    logger.log(`Found ${expiredPartners.length} expired invitations. Deleting...`)

    const deletedIds = expiredPartners.map((p: any) => p.id)

    // Delete related KYC documents first
    await prisma.kYCDocument.deleteMany({
      where: { partnerId: { in: deletedIds } },
    })

    // Delete partners
    await prisma.partner.deleteMany({
      where: { id: { in: deletedIds } },
    })

    logger.complete(deletedIds.length)
  } catch (error) {
    logger.error('Failed to cleanup invites', error instanceof Error ? error : new Error(String(error)))
  }
}
