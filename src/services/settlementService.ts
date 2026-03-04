import prisma from '../config/database'
import { Partner } from '@prisma/client'
import { BadRequestError, ForbiddenError } from '../utils/errors'
import config from '../config'
import { auditLogService } from './auditLog.service'

const GLOBAL_MIN_SETTLEMENT_AMOUNT = parseFloat(process.env.GLOBAL_MIN_SETTLEMENT_AMOUNT || '100')
const SETTLEMENT_FEE = parseFloat(process.env.SETTLEMENT_FEE || '10')

type CreateSettlementResult = {
  success: true
  data: {
    settlementId: string
    requestedAmount: number
    fee: number
    totalDeducted: number
    status: string
    initiatedAt: Date
  }
}

export async function createSettlement(partner: Partner, requestedAmount: number, metadata?: any): Promise<CreateSettlementResult> {
  // Partner checks
  if (!partner.isActive) throw new ForbiddenError('Partner not active')
  if (partner.kycStatus !== 'APPROVED') throw new ForbiddenError('Partner KYC not approved')
  if (!partner.bankAccount) throw new BadRequestError('Partner bank account required')
  if (!partner.bankAccountVerified) throw new BadRequestError('Partner bank account not verified')

  // Amount checks
  const minAmount = partner.minSettlementAmount ? parseFloat(partner.minSettlementAmount.toString()) : GLOBAL_MIN_SETTLEMENT_AMOUNT
  if (requestedAmount < minAmount) throw new BadRequestError('Requested amount below minimum')

  if (partner.maxDailySettlementAmount) {
    const maxDaily = parseFloat(partner.maxDailySettlementAmount.toString())
    // compute today's total settlements
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const totalToday = await prisma.settlement.aggregate({
      where: { partnerId: partner.id, createdAt: { gte: startOfDay } , status: 'PENDING' },
      _sum: { totalDeducted: true },
    })
    const sumToday = totalToday._sum.totalDeducted ? parseFloat(totalToday._sum.totalDeducted.toString()) : 0
    if (sumToday + requestedAmount + SETTLEMENT_FEE > maxDaily) throw new BadRequestError('Exceeds daily settlement limit')
  }

  if (partner.maxSettlementsPerDay) {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const count = await prisma.settlement.count({ where: { partnerId: partner.id, createdAt: { gte: startOfDay }, status: 'PENDING' } })
    if (count >= partner.maxSettlementsPerDay) throw new BadRequestError('Too many settlements today')
  }

  const fee = SETTLEMENT_FEE
  const totalDeducted = parseFloat((requestedAmount + fee).toFixed(2))

  // Concurrency-safe balance check and creation
  let createdSettlement: any = undefined
  try {
    createdSettlement = await prisma.$transaction(async (tx) => {
      // Get wallet
      const wallet = await tx.wallet.findFirst({ where: { partnerId: partner.id } })
      if (!wallet) throw new BadRequestError('Partner wallet not found')

      // calculate total pending settlements (sum of totalDeducted for PENDING)
      const pending = await tx.settlement.aggregate({ where: { partnerId: partner.id, status: 'PENDING' }, _sum: { totalDeducted: true } })
      const totalPending = pending._sum.totalDeducted ? parseFloat(pending._sum.totalDeducted.toString()) : 0

      const availableBalance = parseFloat(wallet.balance.toString()) - totalPending
      if (availableBalance < totalDeducted) {
        throw { code: 'INSUFFICIENT_BALANCE' }
      }

      // create settlement
      const settlement = await tx.settlement.create({
        data: {
          partnerId: partner.id,
          walletId: wallet.id,
          amount: requestedAmount,
          fee,
          netAmount: requestedAmount,
          totalDeducted,
          status: 'PENDING',
          bankAccountSnapshot: partner.bankAccount as any,
          initiatedAt: new Date(),
          metadata,
        },
      })

      // ledger entry: immediate debit
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: totalDeducted,
          type: 'DEBIT',
          reason: 'SETTLEMENT',
          relatedSettlementId: settlement.id,
          description: 'Settlement initiated',
        },
      })

      // update wallet balance
      const newBalance = parseFloat(wallet.balance.toString()) - totalDeducted
      await tx.wallet.update({ where: { id: wallet.id }, data: { balance: newBalance } })

      return settlement
    })

    // Audit: settlement requested
    try {
      if (createdSettlement && createdSettlement.id) {
        await auditLogService.log({
          action: 'SETTLEMENT_REQUESTED',
          actorType: 'PARTNER',
          actorId: partner.id,
          targetType: 'SETTLEMENT',
          targetId: createdSettlement.id,
          description: `Settlement requested: ₹${requestedAmount}`,
          metadata: { amount: requestedAmount, fee: SETTLEMENT_FEE },
        })
      }
    } catch (err) {
      console.warn('Failed to write audit log for settlement requested', err)
    }

    return {
      success: true,
      data: {
        settlementId: createdSettlement.id,
        requestedAmount: parseFloat(createdSettlement.amount.toString()),
        fee: parseFloat(createdSettlement.fee.toString()),
        totalDeducted: parseFloat(createdSettlement.totalDeducted.toString()),
        status: createdSettlement.status,
        initiatedAt: createdSettlement.initiatedAt || createdSettlement.createdAt,
      },
    }
  } catch (err: any) {
    if (err && err.code === 'INSUFFICIENT_BALANCE') {
      const e: any = new Error('Insufficient balance')
      e.status = 409
      throw e
    }
    throw err
  }
}
