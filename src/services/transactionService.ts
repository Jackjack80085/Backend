import prisma from '../config/database'
import { Partner, PaymentMethod } from '@prisma/client'
import { BadRequestError, ForbiddenError } from '../utils/errors'
import { AppError, ErrorCodes } from '../utils/AppError'
import config from '../config'
import { PaywiseService } from './paywise.service'
const paywiseService = new PaywiseService()
import { auditLogService } from './auditLog.service'

type CreateTransactionInput = {
  partner: Partner
  amount: number
  paymentMethod: PaymentMethod
  userReference: string
  idempotencyKey: string
  currency?: string
  customerEmail?: string
  customerPhone?: string
  metadata?: any
  callbackUrl?: string
  ipAddress?: string
  userAgent?: string
}

function isValidUUID(uuid: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid)
}

export async function createTransaction(input: CreateTransactionInput) {
  const { partner, amount, paymentMethod, userReference, idempotencyKey, metadata, callbackUrl, ipAddress, userAgent } = input

  // Partner validation
  if (!partner.isActive) throw new ForbiddenError('Partner is not active')
  if (partner.kycStatus !== 'APPROVED') throw new ForbiddenError('Partner KYC not approved')

  // Amount validation
  if (typeof amount !== 'number' || Number.isNaN(amount) || amount <= 0) throw new BadRequestError('Amount must be > 0')
  if (amount > config.MAX_TRANSACTION_AMOUNT) throw new BadRequestError('Amount exceeds maximum allowed')

  // idempotencyKey
  if (!idempotencyKey || !isValidUUID(idempotencyKey)) throw new BadRequestError('Invalid idempotencyKey')

  // userReference length
  if (typeof userReference !== 'string' || userReference.length === 0 || userReference.length > 512) throw new BadRequestError('Invalid userReference')

  // Idempotency check
  const existing = await prisma.transaction.findFirst({ where: { partnerId: partner.id, idempotencyKey } })
  if (existing) {
    // idempotent response
    console.debug('Idempotent transaction request', { partnerId: partner.id, transactionId: existing.id })
    const expiresAt = existing.expiresAt
    const now = new Date()
    const expiresInSeconds = expiresAt ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000)) : 0
    return {
      success: true,
      data: {
        transactionId: existing.id,
        paymentUrl: existing.paymentUrl,
        amount: parseFloat(existing.amount.toString()),
        commission: parseFloat(existing.commission.toString()),
        netAmount: parseFloat(existing.netAmount.toString()),
        status: existing.status,
        expiresAt,
        expiresInSeconds,
      },
    }
  }

  // Commission calculation
  const commissionRate = partner.commissionRate ? parseFloat(partner.commissionRate.toString()) : 0
  const commission = parseFloat((Math.round((amount * (commissionRate / 100)) * 100) / 100).toFixed(2))
  const netAmount = parseFloat((amount - commission).toFixed(2))
  if (!isFinite(commission) || !isFinite(netAmount)) throw new Error('Commission calculation failed')

  // Create transaction
  const now = new Date()
  const expiresAt = new Date(now.getTime() + config.TRANSACTION_EXPIRES_MINUTES * 60 * 1000)

  const created = await prisma.transaction.create({
    data: {
      partnerId: partner.id,
      amount: amount.toFixed(2),
      commission: commission.toFixed(2),
      netAmount: netAmount.toFixed(2),
      paymentMethod,
      status: 'PENDING',
      userReference,
      idempotencyKey,
      metadata,
      expiresAt,
      ipAddress,
      userAgent,
      callbackUrl,
    },
  })

  // ---- Call Paywise to create payment session ----
  let paymentUrl: string
  let paywiseSessionId: string | null = null
  let paywiseExpiresAt: Date = expiresAt
  let qrCode: string | null = null
  let upiIntent: string | null = null

  try {
    const paywiseResult = await paywiseService.initiateCollection({
      transactionId: created.id,
      amount,
      userEmail: input.customerEmail,
      userPhone: input.customerPhone,
      callbackUrl: callbackUrl,
    });
    paymentUrl = paywiseResult.paymentUrl || paywiseResult.upiIntent || '';
    paywiseSessionId = paywiseResult.paywiseTransactionId || null;
    qrCode = paywiseResult.qrCode || null;
    upiIntent = paywiseResult.upiIntent || null;
  } catch (err) {
    // Paywise unavailable (sandbox / no credentials) — keep transaction PENDING
    // so dev simulate endpoints (/dev/complete-payment, /dev/fail-payment) still work
    console.warn('[createTransaction] Paywise call failed, using fallback (sandbox mode)', (err as any)?.message)
    paymentUrl = `${process.env.APP_URL || 'http://localhost:5000'}/pay?txn=${created.id}`
  }

  console.log('[createTransaction] updating txn', created.id, 'paymentUrl:', paymentUrl, 'paywiseSessionId:', paywiseSessionId)
  // Update transaction with Paywise details
  await prisma.transaction.update({
    where: { id: created.id },
    data: {
      paymentUrl,
      paywiseSessionId,
      expiresAt: paywiseExpiresAt,
      metadata: {
        ...((created.metadata as any) ?? {}),
        paywizeQrCode: qrCode || undefined,
        paywizeUpiIntent: upiIntent || undefined,
      } as any,
    },
  })

  // Audit: payment initiated
  try {
    await auditLogService.log({
      action: 'PAYMENT_INITIATED',
      actorType: 'PARTNER',
      actorId: partner.id,
      targetType: 'TRANSACTION',
      targetId: created.id,
      description: `Payment initiated: ₹${amount}`,
      metadata: { amount, commission: parseFloat(created.commission.toString()), paymentMethod },
    })
  } catch (err) {
    console.warn('Failed to write audit log for payment initiated', err)
  }

  const expiresInSeconds = Math.max(0, Math.floor((paywiseExpiresAt.getTime() - Date.now()) / 1000))

  return {
    success: true,
    data: {
      transactionId: created.id,
      paymentUrl,
      amount: parseFloat(created.amount.toString()),
      commission: parseFloat(created.commission.toString()),
      netAmount: parseFloat(created.netAmount.toString()),
      status: created.status,
      expiresAt: paywiseExpiresAt,
      expiresInSeconds,
    },
  }
}
