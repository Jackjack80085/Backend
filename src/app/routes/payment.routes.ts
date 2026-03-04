import { Router, Request, Response, NextFunction } from 'express'
import authenticatePartner from '../../middlewares/authenticatePartner'
import { validate, paymentInitiationSchema } from '../../middlewares/validation.middleware'
import { rateLimit } from '../../middlewares/rateLimit.middleware'
import { createTransaction } from '../../services/transactionService'
import { PaywiseService } from '../../services/paywise.service'
const paywiseService = new PaywiseService()
import { completePayment, failPayment } from '../../services/payment.service'
import prisma from '../../config/database'

const router = Router()

// All payment routes require partner auth
router.use(authenticatePartner)
router.use(rateLimit('payment'))

/**
 * @swagger
 * /api/v1/payments/initiate:
 *   post:
 *     summary: Initiate a new payment
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *       - SignatureAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, idempotencyKey, userReference]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1000.00
 *               currency:
 *                 type: string
 *                 example: INR
 *               idempotencyKey:
 *                 type: string
 *                 format: uuid
 *               userReference:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [UPI, CARD, NETBANKING, WALLET]
 *               callbackUrl:
 *                 type: string
 *                 format: uri
 *               customerEmail:
 *                 type: string
 *                 format: email
 *               customerPhone:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactionId:
 *                       type: string
 *                     paymentUrl:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     commission:
 *                       type: number
 *                     netAmount:
 *                       type: number
 *                     status:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication failed
 */
router.post(
  '/initiate',
  validate(paymentInitiationSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const partner = (req as any).partner
      const { amount, paymentMethod, userReference, idempotencyKey, currency, callbackUrl, customerEmail, customerPhone, metadata } = req.body

      const result = await createTransaction({
        partner,
        amount,
        paymentMethod: paymentMethod || 'UPI',
        userReference,
        idempotencyKey,
        currency,
        callbackUrl,
        customerEmail,
        customerPhone,
        metadata,
        ipAddress: req.ip,
        userAgent: req.header('user-agent'),
      })

      res.json(result)
    } catch (err) {
      next(err)
    }
  },
)

/**
 * @swagger
 * /api/v1/payments/{transactionId}/status:
 *   get:
 *     summary: Get payment status
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *       - SignatureAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Transaction status
 *       404:
 *         description: Transaction not found
 */
router.get('/:transactionId/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = (req as any).partner
    const txn = await prisma.transaction.findFirst({
      where: { id: req.params.transactionId as string, partnerId: partner.id },
    })
    if (!txn) {
      return res.status(404).json({ success: false, error: { code: 'TRANSACTION_NOT_FOUND', message: 'Transaction not found' } })
    }

    res.json({
      success: true,
      data: {
        transactionId: txn.id,
        status: txn.status,
        amount: parseFloat(txn.amount.toString()),
        commission: parseFloat(txn.commission.toString()),
        netAmount: parseFloat(txn.netAmount.toString()),
        paymentMethod: txn.paymentMethod,
        paymentUrl: txn.paymentUrl,
        completedAt: txn.completedAt,
        failureReason: txn.failureReason,
        createdAt: txn.createdAt,
      },
    })
  } catch (err) {
    next(err)
  }
})

/**
 * GET /api/v1/payments/:id/check-status
 * Manually poll Paywise for transaction status (fallback)
 */
router.get('/:id/check-status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partner = (req as any).partner
    const transactionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    const transaction = await prisma.transaction.findUnique({ where: { id: transactionId } })
    if (!transaction || transaction.partnerId !== partner.id) {
      return res.status(404).json({ success: false, error: { code: 'TRANSACTION_NOT_FOUND', message: 'Transaction not found' } })
    }

    if (transaction.status !== 'PENDING') {
      return res.json({ success: true, data: { transactionId: transaction.id, status: transaction.status, amount: transaction.amount, completedAt: transaction.completedAt } })
    }

    // Check with Paywise
    try {
      const paywiseStatus = await paywiseService.checkCollectionStatus({ senderId: transactionId })

      if (paywiseStatus.status !== 'PENDING') {
        if (paywiseStatus.status === 'SUCCESS') {
          await completePayment({
            transactionId,
            paywiseTxnId: paywiseStatus.paywiseTransactionId || `paywise_${Date.now()}`,
            paymentMethod: paywiseStatus.paymentMethod || 'UPI',
            completedAt: new Date()
          })
        } else if (paywiseStatus.status === 'FAILED') {
          await failPayment({ transactionId, failureReason: 'Payment failed' })
        }
      }
    } catch (err) {
      console.error('[PAYMENT] Paywise status check failed', err)
      // fall through and return cached status
    }

    const updated = await prisma.transaction.findUnique({ where: { id: transactionId } })
    return res.json({ success: true, data: { transactionId: updated!.id, status: updated!.status, amount: updated!.amount, completedAt: updated!.completedAt } })
  } catch (err) {
    next(err)
  }
})

export default router

