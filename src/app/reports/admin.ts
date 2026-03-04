import { Router, Request, Response } from 'express'
import requireAdmin from '../../middlewares/requireAdmin'
import prisma from '../../config/database'
import { validateDateRange } from '../../utils/dateRange'
import { reconcileAllPartnerWallets, reconcilePlatformWallet } from '../../services/reconciliationService'

const router = Router()

router.use(requireAdmin)

router.get('/settlements', async (req: Request, res: Response) => {
  try {
    const filters: any = {}
    if (req.query.partnerId) filters.partnerId = req.query.partnerId
    if (req.query.status) filters.status = req.query.status
    const { fromDate, toDate } = validateDateRange(req.query.from as string | undefined, req.query.to as string | undefined)
    filters.createdAt = { gte: fromDate, lte: toDate }

    const page = parseInt((req.query.page as string) || '1', 10)
    const per = parseInt((req.query.per as string) || '50', 10)

    const [items, total] = await Promise.all([
      prisma.settlement.findMany({
        where: filters,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
        include: { partner: { select: { id: true, businessName: true, email: true } } }
      }),
      prisma.settlement.count({ where: filters })
    ])

    const data = items.map((s: any) => ({
      ...s,
      amount: parseFloat(s.amount?.toString() || '0'),
      fee: parseFloat(s.fee?.toString() || '0'),
      netAmount: parseFloat(s.netAmount?.toString() || '0'),
      totalDeducted: parseFloat(s.totalDeducted?.toString() || '0'),
    }))

    res.json({ data, total, page, per })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/ledger', async (req: Request, res: Response) => {
  try {
    const filters: any = {}
    if (req.query.walletId) filters.walletId = req.query.walletId
    if (req.query.partnerId) filters.wallet = { partnerId: req.query.partnerId }
    if (req.query.type) filters.type = req.query.type
    if (req.query.minAmount || req.query.maxAmount) {
      filters.amount = {}
      if (req.query.minAmount) filters.amount.gte = parseFloat(req.query.minAmount as string)
      if (req.query.maxAmount) filters.amount.lte = parseFloat(req.query.maxAmount as string)
    }
    if (req.query.hasSettlement) filters.relatedSettlementId = { not: null }
    if (req.query.hasTransaction) filters.relatedTransactionId = { not: null }
    if (req.query.description) filters.description = { contains: req.query.description as string }

    const page = parseInt((req.query.page as string) || '1', 10)
    const per = parseInt((req.query.per as string) || '50', 10)

    const items = await prisma.walletTransaction.findMany({ where: filters, orderBy: { createdAt: 'desc' }, skip: (page - 1) * per, take: per })
    res.json({ data: items, page, per })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/reconciliation', async (req: Request, res: Response) => {
  try {
    const showOnlyMismatches = req.query.showOnlyMismatches === 'true'
    const { fromDate, toDate } = validateDateRange(req.query.from as string | undefined, req.query.to as string | undefined)

    const results = await reconcileAllPartnerWallets({ from: fromDate.toISOString(), to: toDate.toISOString() })
    const summary = { totalWallets: results.length, okCount: results.filter(r => r.status === 'OK').length, mismatchCount: results.filter(r => r.status === 'MISMATCH').length, criticalCount: results.filter(r => r.status === 'CRITICAL').length, lastRunAt: new Date() }

    let wallets = results.map(r => ({ walletId: r.walletId, ownerType: r.ownerType, ownerId: r.ownerId, ownerName: r.ownerName, walletBalance: r.walletBalance, ledgerBalance: r.ledgerBalance, difference: r.difference, status: r.status }))
    if (showOnlyMismatches) wallets = wallets.filter(w => w.status !== 'OK')

    // sort by severity
    const order = { CRITICAL: 0, MISMATCH: 1, OK: 2 }
    wallets.sort((a: any, b: any) => (order as any)[a.status] - (order as any)[b.status])

    res.json({ summary, wallets })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/platform-stats', async (req: Request, res: Response) => {
  try {
    const { fromDate, toDate } = validateDateRange(req.query.from as string | undefined, req.query.to as string | undefined, 30)

    const [totalPartners, activePartners] = await Promise.all([
      prisma.partner.count(),
      prisma.partner.count({ where: { status: 'ACTIVE' } })
    ])

    const platformWallet = await prisma.wallet.findFirst({ where: { type: 'PLATFORM' } })

    const txnAgg: any = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*) AS total_count,
        COALESCE(SUM(CASE WHEN status='SUCCESS' THEN amount ELSE 0 END),0) AS total_volume,
        COALESCE(SUM(CASE WHEN status='SUCCESS' THEN commission ELSE 0 END),0) AS total_commission,
        COUNT(CASE WHEN status='PENDING' THEN 1 END) AS pending_count,
        COUNT(CASE WHEN status='SUCCESS' THEN 1 END) AS success_count,
        COUNT(CASE WHEN status='FAILED' THEN 1 END) AS failed_count
      FROM "Transaction"
      WHERE "createdAt" >= $1 AND "createdAt" <= $2
    `, fromDate, toDate)
    const row = Array.isArray(txnAgg) ? txnAgg[0] : txnAgg

    const pendingSettlementsAgg: any = await prisma.settlement.aggregate({
      where: { status: { in: ['PENDING', 'PROCESSING'] } },
      _count: true,
      _sum: { amount: true }
    })

    const partnerWallets = await prisma.wallet.findMany({
      where: { type: 'PARTNER' },
      include: { partner: { select: { id: true, businessName: true, status: true, commissionRate: true } } },
      orderBy: { balance: 'desc' },
      take: 50
    })

    res.json({
      partners: { total: totalPartners, active: activePartners },
      platformWallet: platformWallet ? {
        id: platformWallet.id,
        balance: parseFloat(platformWallet.balance.toString()),
        currency: platformWallet.currency
      } : null,
      transactions: {
        totalCount: parseInt(row?.total_count?.toString() || '0'),
        totalVolume: parseFloat(row?.total_volume?.toString() || '0'),
        totalCommission: parseFloat(row?.total_commission?.toString() || '0'),
        pendingCount: parseInt(row?.pending_count?.toString() || '0'),
        successCount: parseInt(row?.success_count?.toString() || '0'),
        failedCount: parseInt(row?.failed_count?.toString() || '0'),
      },
      pendingSettlements: {
        count: pendingSettlementsAgg._count || 0,
        amount: pendingSettlementsAgg._sum?.amount ? parseFloat(pendingSettlementsAgg._sum.amount.toString()) : 0
      },
      partnerWallets: partnerWallets.map(w => ({
        walletId: w.id,
        partnerId: w.partnerId,
        businessName: w.partner?.businessName || 'Unknown',
        partnerStatus: w.partner?.status || 'UNKNOWN',
        balance: parseFloat(w.balance.toString()),
        currency: w.currency,
        commissionRate: w.partner?.commissionRate ? parseFloat(w.partner.commissionRate.toString()) : 0
      }))
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/transactions', async (req: Request, res: Response) => {
  try {
    const filters: any = {}
    if (req.query.partnerId) filters.partnerId = req.query.partnerId
    if (req.query.status) filters.status = req.query.status
    const { fromDate, toDate } = validateDateRange(req.query.from as string | undefined, req.query.to as string | undefined)
    filters.createdAt = { gte: fromDate, lte: toDate }

    const page = parseInt((req.query.page as string) || '1', 10)
    const per = parseInt((req.query.per as string) || '50', 10)

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where: filters,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
        include: { partner: { select: { id: true, businessName: true } } }
      }),
      prisma.transaction.count({ where: filters })
    ])

    res.json({ data: items, total, page, per })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/paywise-settlements', async (req: Request, res: Response) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10)
    const per = parseInt((req.query.per as string) || '50', 10)

    const platformWallet = await prisma.wallet.findFirst({ where: { type: 'PLATFORM' } })
    if (!platformWallet) return res.json({ data: [], total: 0, totalSettled: 0, page, per })

    const where = {
      walletId: platformWallet.id,
      type: 'CREDIT' as const,
      reason: 'ADJUSTMENT' as const,
      paywiseTxnId: { startsWith: 'pws_' },
    }

    const [items, total, agg] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * per,
        take: per,
      }),
      prisma.walletTransaction.count({ where }),
      prisma.walletTransaction.aggregate({ where, _sum: { amount: true } }),
    ])

    const data = items.map((e: any) => ({
      id: e.id,
      paywiseSettlementId: (e.paywiseTxnId || '').replace(/^pws_/, ''),
      amount: parseFloat(e.amount?.toString() || '0'),
      description: e.description,
      createdAt: e.createdAt,
    }))

    const totalSettled = parseFloat(agg._sum?.amount?.toString() || '0')

    res.json({ data, total, totalSettled, page, per })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
