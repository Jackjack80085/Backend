import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../../config/database'
import { validateDateRange } from '../../utils/dateRange'

const router = Router()

// JWT middleware that loads full partner with wallet relation
router.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Partner authentication required' })
    }
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { partnerId: string }
    const partner = await prisma.partner.findUnique({
      where: { id: decoded.partnerId },
      include: { wallet: true }
    })
    if (!partner) return res.status(404).json({ error: 'Partner not found' })
    ;(req as any).partner = partner
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' })
  }
})

router.get('/earnings', async (req: Request, res: Response) => {
  const partner = (req as any).partner
  try {
    const { fromDate, toDate } = validateDateRange(req.query.from as string | undefined, req.query.to as string | undefined)

    const walletId = partner.wallet?.id
    let totalEarned = 0
    let totalWithdrawn = 0

    if (walletId) {
      const earnedRow: any = await prisma.$queryRawUnsafe(`
        SELECT COALESCE(SUM(CASE WHEN "type"='CREDIT' AND "reason"='PAYMENT' THEN amount ELSE 0 END),0) AS total_earned,
               COALESCE(SUM(CASE WHEN "type"='DEBIT' AND "reason"='SETTLEMENT' THEN amount ELSE 0 END),0) AS total_withdrawn
        FROM "WalletTransaction" WHERE "walletId" = $1::uuid AND "createdAt" >= $2 AND "createdAt" <= $3
      `, walletId, fromDate, toDate)
      totalEarned = parseFloat(earnedRow?.[0]?.total_earned?.toString() || earnedRow?.total_earned?.toString() || '0')
      totalWithdrawn = parseFloat(earnedRow?.[0]?.total_withdrawn?.toString() || earnedRow?.total_withdrawn?.toString() || '0')
    }

    // Also sum from Transaction table for totalPayin (gross) and totalCommission
    const txnAgg: any = await prisma.$queryRawUnsafe(`
      SELECT COALESCE(SUM(CASE WHEN status='SUCCESS' THEN amount ELSE 0 END),0) AS total_payin,
             COALESCE(SUM(CASE WHEN status='SUCCESS' THEN commission ELSE 0 END),0) AS total_commission,
             COUNT(CASE WHEN status='PENDING' THEN 1 END) AS pending_count,
             COUNT(CASE WHEN status='SUCCESS' THEN 1 END) AS success_count
      FROM "Transaction" WHERE "partnerId" = $1::uuid AND "createdAt" >= $2 AND "createdAt" <= $3
    `, partner.id, fromDate, toDate)
    const row = Array.isArray(txnAgg) ? txnAgg[0] : txnAgg

    const wallet = partner.wallet
    const pendingSettlementsRow: any = await prisma.settlement.aggregate({ where: { partnerId: partner.id, status: 'PENDING' }, _sum: { totalDeducted: true } })
    const pendingSettlements = pendingSettlementsRow._sum.totalDeducted ? parseFloat(pendingSettlementsRow._sum.totalDeducted.toString()) : 0

    const currentBalance = wallet ? parseFloat(wallet.balance.toString()) : 0
    const availableBalance = currentBalance - pendingSettlements

    res.json({
      summary: {
        totalEarned,
        totalWithdrawn,
        currentBalance,
        pendingSettlements,
        availableBalance,
        totalPayin: parseFloat(row?.total_payin?.toString() || '0'),
        totalCommission: parseFloat(row?.total_commission?.toString() || '0'),
        pendingTransactions: parseInt(row?.pending_count?.toString() || '0'),
        successTransactions: parseInt(row?.success_count?.toString() || '0'),
      },
      breakdown: []
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/settlements', async (req: Request, res: Response) => {
  const partner = (req as any).partner
  try {
    const filters: any = { partnerId: partner.id }
    if (req.query.status) filters.status = req.query.status
    if (req.query.minAmount || req.query.maxAmount) {
      filters.amount = {}
      if (req.query.minAmount) filters.amount.gte = parseFloat(req.query.minAmount as string)
      if (req.query.maxAmount) filters.amount.lte = parseFloat(req.query.maxAmount as string)
    }
    const { fromDate, toDate } = validateDateRange(req.query.from as string | undefined, req.query.to as string | undefined)
    filters.createdAt = { gte: fromDate, lte: toDate }

    const page = parseInt((req.query.page as string) || '1', 10)
    const per = parseInt((req.query.per as string) || '20', 10)

    const [items, total] = await Promise.all([
      prisma.settlement.findMany({ where: filters, orderBy: { createdAt: 'desc' }, skip: (page - 1) * per, take: per }),
      prisma.settlement.count({ where: filters })
    ])
    res.json({ data: items, total, page, per })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/transactions', async (req: Request, res: Response) => {
  const partner = (req as any).partner
  try {
    const filters: any = { partnerId: partner.id }
    if (req.query.status) filters.status = req.query.status
    const { fromDate, toDate } = validateDateRange(req.query.from as string | undefined, req.query.to as string | undefined)
    filters.createdAt = { gte: fromDate, lte: toDate }

    const page = parseInt((req.query.page as string) || '1', 10)
    const per = parseInt((req.query.per as string) || '20', 10)

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where: filters,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
        select: {
          id: true,
          amount: true,
          commission: true,
          netAmount: true,
          status: true,
          paymentMethod: true,
          userReference: true,
          createdAt: true,
          completedAt: true,
          failureReason: true,
        }
      }),
      prisma.transaction.count({ where: filters })
    ])

    res.json({ data: items, total, page, per })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
