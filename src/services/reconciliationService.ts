import prisma from '../config/database'
import { Prisma } from '@prisma/client'
import { BadRequestError, ForbiddenError } from '../utils/errors'
import { validateDateRange } from '../utils/dateRange'

type ReconcileResult = {
  walletId: string
  ownerType: 'PARTNER' | 'PLATFORM'
  ownerId?: string
  ownerName?: string
  walletBalance: number
  ledgerBalance: number
  difference: number
  status: 'OK' | 'MISMATCH' | 'CRITICAL'
  creditCount: number
  debitCount: number
  totalCredited: number
  totalDebited: number
  oldestEntry: Date | null
  newestEntry: Date | null
  checkedAt: Date
}

async function computeLedgerAggregates(walletId: string, fromDate: Date, toDate: Date) {
  // use raw SQL aggregate for performance
  const row: any = await prisma.$queryRawUnsafe(`
    SELECT
      COUNT(*) FILTER (WHERE "type" = 'CREDIT') AS credit_count,
      COUNT(*) FILTER (WHERE "type" = 'DEBIT') AS debit_count,
      COALESCE(SUM(CASE WHEN "type" = 'CREDIT' THEN amount ELSE 0 END), 0) AS total_credited,
      COALESCE(SUM(CASE WHEN "type" = 'DEBIT' THEN amount ELSE 0 END), 0) AS total_debited,
      MIN("createdAt") AS oldest_entry,
      MAX("createdAt") AS newest_entry
    FROM "WalletTransaction"
    WHERE "walletId" = $1 AND "createdAt" >= $2 AND "createdAt" <= $3
  `, walletId, fromDate, toDate) as any

  return {
    creditCount: Number(row.credit_count || 0),
    debitCount: Number(row.debit_count || 0),
    totalCredited: parseFloat(row.total_credited || '0'),
    totalDebited: parseFloat(row.total_debited || '0'),
    oldestEntry: row.oldest_entry ? new Date(row.oldest_entry) : null,
    newestEntry: row.newest_entry ? new Date(row.newest_entry) : null,
  }
}

function computeStatus(walletBalance: number, ledgerBalance: number) {
  if (walletBalance < 0) return 'CRITICAL'
  if (Math.abs(walletBalance - ledgerBalance) > 0) return 'MISMATCH'
  return 'OK'
}

export async function reconcileWallet(walletId: string, options?: { from?: string; to?: string; autoFix?: boolean; adminId?: string }) {
  const { fromDate, toDate } = validateDateRange(options?.from, options?.to)

  const wallet = await prisma.wallet.findUnique({ where: { id: walletId }, include: { partner: true } })
  if (!wallet) throw new BadRequestError('Wallet not found')

  const aggregates = await computeLedgerAggregates(walletId, fromDate, toDate)

  const ledgerBalance = parseFloat((aggregates.totalCredited - aggregates.totalDebited).toFixed(2))
  const walletBalance = parseFloat(wallet.balance.toString())
  const difference = parseFloat((walletBalance - ledgerBalance).toFixed(2))
  const status = computeStatus(walletBalance, ledgerBalance) as 'OK' | 'MISMATCH' | 'CRITICAL'

  const result: ReconcileResult = {
    walletId: wallet.id,
    ownerType: wallet.type === 'PLATFORM' ? 'PLATFORM' : 'PARTNER',
    ownerId: wallet.partnerId || undefined,
    ownerName: wallet.partner?.businessName || undefined,
    walletBalance,
    ledgerBalance,
    difference,
    status,
    creditCount: aggregates.creditCount,
    debitCount: aggregates.debitCount,
    totalCredited: parseFloat(aggregates.totalCredited.toFixed(2)),
    totalDebited: parseFloat(aggregates.totalDebited.toFixed(2)),
    oldestEntry: aggregates.oldestEntry,
    newestEntry: aggregates.newestEntry,
    checkedAt: new Date(),
  }

  // Auto-fix only when requested and status is MISMATCH
  if (options?.autoFix && options.adminId) {
    if (status === 'MISMATCH') {
      // perform update
      const prevBalance = parseFloat(wallet.balance.toString())
      await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: ledgerBalance, lastReconciledAt: new Date(), lastReconciliationStatus: status } })
      // audit log
      console.info(JSON.stringify({ action: 'RECONCILIATION_AUTOFIX', walletId: wallet.id, previousBalance: prevBalance, newBalance: ledgerBalance, adminId: options.adminId, timestamp: new Date().toISOString() }))
      // update result
      result.walletBalance = ledgerBalance
      result.difference = parseFloat((result.walletBalance - result.ledgerBalance).toFixed(2))
      result.status = computeStatus(result.walletBalance, result.ledgerBalance) as any
    }
  }

  // update wallet reconciliation metadata (without fixing)
  if (!options?.autoFix) {
    await prisma.wallet.update({ where: { id: wallet.id }, data: { lastReconciledAt: new Date(), lastReconciliationStatus: result.status } })
  }

  return result
}

export async function reconcileAllPartnerWallets(options?: { from?: string; to?: string }) {
  const wallets = await prisma.wallet.findMany({ where: { type: 'PARTNER' } })
  const results = [] as ReconcileResult[]
  for (const w of wallets) {
    // eslint-disable-next-line no-await-in-loop
    const r = await reconcileWallet(w.id, { from: options?.from, to: options?.to })
    results.push(r)
  }
  return results
}

export async function reconcilePlatformWallet(options?: { from?: string; to?: string; autoFix?: boolean; adminId?: string }) {
  const wallet = await prisma.wallet.findFirst({ where: { type: 'PLATFORM' } })
  if (!wallet) throw new BadRequestError('Platform wallet not found')
  return reconcileWallet(wallet.id, options)
}
