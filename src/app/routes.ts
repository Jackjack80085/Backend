import { Router, Request, Response } from 'express'
import paywiseWebhook from './webhooks/paywise'
import paywiseSettlementWebhook from './webhooks/paywise-settlement'
import partnerReports from './reports/partner'
import adminReports from './reports/admin'
import paymentRoutes from './routes/payment.routes'
import settlementRoutes from './routes/settlement.routes'
import partnerRoutes from './routes/partner.routes'
import adminAuthRoutes from './routes/adminAuth.routes'
import partnerInvitationRoutes from './routes/partnerInvitation.routes'
import kycDocumentRoutes from './routes/kycDocument.routes'
import partnerAuthRoutes from './routes/partnerAuth.routes'
import apiKeyRotationRoutes from './routes/apiKeyRotation.routes'
import auditLogRoutes from './routes/auditLog.routes'
import { completePayment, failPayment } from '../services/payment.service'
import prisma from '../config/database'

const router = Router()

router.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

// Webhooks (no auth – Paywise handles signature)
router.use('/webhooks/paywise', paywiseWebhook)
router.use('/webhooks/paywise-settlement', paywiseSettlementWebhook)

// API v1 routes
router.use('/api/v1/payments', paymentRoutes)
router.use('/api/v1/settlements', settlementRoutes)
router.use('/api/v1/partners', partnerRoutes)
router.use('/api/v1', partnerInvitationRoutes)
router.use('/api/v1', kycDocumentRoutes)
router.use('/api/v1', apiKeyRotationRoutes)
router.use('/api/v1', auditLogRoutes)
// Admin auth routes (login / register)
router.use('/auth/admin', adminAuthRoutes)
router.use('/auth/partner', partnerAuthRoutes)

// Report routes
router.use('/partner/reports', partnerReports)
router.use('/admin/reports', adminReports)

// ---- DEV ONLY: mock payment completion ----
router.post('/dev/complete-payment/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const txn = await prisma.transaction.findUnique({ where: { id } })
    if (!txn) return res.status(404).json({ error: 'Transaction not found' })
    if (txn.status !== 'PENDING') return res.status(400).json({ error: `Transaction is already ${txn.status}` })
    await completePayment({
      transactionId: id,
      paywiseTxnId: `mock_complete_${Date.now()}`,
      paymentMethod: 'UPI',
      completedAt: new Date(),
    })
    res.json({ success: true, message: 'Payment marked as SUCCESS', transactionId: txn.id })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/dev/fail-payment/:id', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const txn = await prisma.transaction.findUnique({ where: { id } })
    if (!txn) return res.status(404).json({ error: 'Transaction not found' })
    if (txn.status !== 'PENDING') return res.status(400).json({ error: `Transaction is already ${txn.status}` })
    await failPayment({ transactionId: id, failureReason: 'Manually failed (dev)' })
    res.json({ success: true, message: 'Payment marked as FAILED', transactionId: txn.id })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
