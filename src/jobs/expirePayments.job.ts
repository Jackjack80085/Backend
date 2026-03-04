import prisma from '../config/database'
import { JobLogger } from '../utils/jobLogger'

const PAYMENT_EXPIRY_MINUTES = parseInt(process.env.PAYMENT_EXPIRY_MINUTES || '30')

export async function expirePaymentsJob() {
  const logger = new JobLogger('expirePayments')

  try {
    logger.log(`Checking for payments expired after ${PAYMENT_EXPIRY_MINUTES} minutes...`)

    const expiryThreshold = new Date(Date.now() - PAYMENT_EXPIRY_MINUTES * 60 * 1000)

    const expiredTransactions = await prisma.transaction.updateMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: expiryThreshold },
      },
      data: {
        status: 'FAILED',
        failureReason: 'Transaction expired',
      },
    })

    logger.complete(expiredTransactions.count)
  } catch (error) {
    logger.error('Failed to expire payments', error instanceof Error ? error : new Error(String(error)))
  }
}
