import prisma from '../config/database'
import { AppError, ErrorCodes } from '../utils/AppError'
import { auditLogService } from './auditLog.service'
import type { Prisma, Transaction } from '@prisma/client'

// ---- completePayment ----

export async function completePayment(params: {
  transactionId: string
  paywiseTxnId: string
  paymentMethod?: string
  completedAt: Date
}) {
  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Update transaction → SUCCESS
    const transaction = await tx.transaction.update({
      where: { id: params.transactionId },
      data: {
        status: 'SUCCESS',
        paymentMethod: (params.paymentMethod as any) || undefined,
        paywiseTxnId: params.paywiseTxnId,
        completedAt: params.completedAt,
      },
    })

    // 2. Get partner wallet
    const partnerWallet = await tx.wallet.findFirst({ where: { partnerId: transaction.partnerId } })
    if (!partnerWallet) throw new AppError(500, 'Partner wallet not found', ErrorCodes.WALLET_NOT_FOUND)

    // 3. Get platform wallet
    const platformWallet = await tx.wallet.findFirst({ where: { type: 'PLATFORM' } })
    if (!platformWallet) throw new AppError(500, 'Platform wallet not configured', ErrorCodes.PLATFORM_WALLET_MISSING)

    // 4. Credit partner wallet (net amount)
    await tx.walletTransaction.create({
      data: {
        walletId: partnerWallet.id,
        type: 'CREDIT',
        amount: transaction.netAmount,
        reason: 'PAYMENT',
        relatedTransactionId: transaction.id,
        paywiseTxnId: params.paywiseTxnId,
        description: `Payment received – ${transaction.id}`,
      },
    })
    await tx.wallet.update({
      where: { id: partnerWallet.id },
      data: { balance: { increment: transaction.netAmount } },
    })

    // 5. Credit platform commission
    await tx.walletTransaction.create({
      data: {
        walletId: platformWallet.id,
        type: 'CREDIT',
        amount: transaction.commission,
        reason: 'COMMISSION',
        relatedTransactionId: transaction.id,
        paywiseTxnId: `${params.paywiseTxnId}_commission`,
        description: `Commission earned – ${transaction.id}`,
      },
    })
    await tx.wallet.update({
      where: { id: platformWallet.id },
      data: { balance: { increment: transaction.commission } },
    })

    return transaction
  })
  .then(async (tx: Transaction) => {
    // Audit: payment completed
    try {
      await auditLogService.log({
        action: 'PAYMENT_COMPLETED',
        actorType: 'SYSTEM',
        targetType: 'TRANSACTION',
        targetId: tx.id,
        description: `Payment completed: ₹${tx.amount}`,
        metadata: { paywiseTxnId: tx.paywiseTxnId, netAmount: tx.netAmount, commission: tx.commission },
      })
    } catch (err) {
      console.warn('Failed to write audit log for payment completed', err)
    }
    return tx
  })
}

// ---- failPayment ----

export async function failPayment(params: {
  transactionId: string
  failureReason: string
}) {
  await prisma.transaction.update({
    where: { id: params.transactionId },
    data: {
      status: 'FAILED',
      failureReason: params.failureReason,
      completedAt: new Date(),
    },
  })
  try {
    await auditLogService.log({
      action: 'PAYMENT_FAILED',
      actorType: 'SYSTEM',
      targetType: 'TRANSACTION',
      targetId: params.transactionId,
      description: `Payment failed: ${params.failureReason}`,
      metadata: { failureReason: params.failureReason },
    })
  } catch (err) {
    console.warn('Failed to write audit log for payment failed', err)
  }
}
