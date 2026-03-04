import { Router, Request, Response } from 'express'
import prisma from '../../config/database'
import { PaywiseService } from '../../services/paywise.service'
const paywiseService = new PaywiseService()
import { completePayment, failPayment } from '../../services/payment.service'
import partnerWebhookService from '../../services/partnerWebhook.service'

const router = Router()

// Simple in-memory rate limiter per IP (500 req/min for webhook retries)
const RATE_LIMIT = 500
const WINDOW_MS = 60 * 1000
const ipMap = new Map<string, number[]>()

function rateLimit(req: Request) {
  const ip = req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown'
  const now = Date.now()
  const arr = ipMap.get(ip) || []
  const windowed = arr.filter((t) => now - t < WINDOW_MS)
  windowed.push(now)
  ipMap.set(ip, windowed)
  return windowed.length <= RATE_LIMIT
}

/**
 * @swagger
 * /webhooks/paywise:
 *   post:
 *     summary: Paywise payment webhook callback
 *     tags: [Webhooks]
 *     description: >
 *       Called by Paywise after a user completes or fails a payment.
 *       Verifies HMAC signature, updates transaction, credits wallets,
 *       and notifies the partner asynchronously.
 *     responses:
 *       200:
 *         description: Webhook acknowledged
 *       401:
 *         description: Invalid or missing signature
 *       404:
 *         description: Transaction not found
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    // Rate limit
    if (!rateLimit(req)) {
      console.warn('[webhook] Rate limit exceeded', { ip: req.ip })
      return res.status(429).json({ error: 'Too many requests' })
    }

    // 1. Verify signature header (HMAC)
    const rawSignature = (req.header('X-Paywise-Signature') || req.header('X-Signature') || '').toString()
    const signature = rawSignature.includes('=') ? rawSignature.split('=')[1] : rawSignature
    if (!signature) {
      console.warn('[webhook] Missing signature header')
      return res.status(401).json({ error: 'Missing signature' })
    }

    const isValid = paywiseService.verifyWebhookSignature(req.body, signature)
    if (!isValid) {
      console.warn('[webhook] Invalid signature')
      return res.status(401).json({ error: 'Invalid signature' })
    }

    // 2. Extract encrypted payload and decrypt
    const encrypted = (req.body && (req.body.payload || req.body.data || req.body.encrypted)) || null
    if (!encrypted) {
      console.warn('[webhook] Missing encrypted payload')
      return res.status(400).json({ error: 'Missing payload' })
    }

    let decryptedPayload: any
    try {
      decryptedPayload = paywiseService.decryptWebhookPayload(encrypted)
    } catch (err) {
      console.warn('[webhook] Decryption failed', err)
      return res.status(400).json({ error: 'Invalid payload' })
    }

    // normalize commonly named fields
    const event = decryptedPayload.event || decryptedPayload.type || null
    const order_id = decryptedPayload.senderId || decryptedPayload.sender_id || decryptedPayload.order_id || decryptedPayload.client_ref_id || null
    const paywiseTxnId = decryptedPayload.transactionId || decryptedPayload.txnId || decryptedPayload.transaction_id || decryptedPayload.txn_id || null
    const payment_method = decryptedPayload.paymentMethod || decryptedPayload.payment_mode || decryptedPayload.payment_method || null
    const failure_reason = decryptedPayload.failureReason || decryptedPayload.statusMessage || decryptedPayload.failure_reason || null
    const status = decryptedPayload.status || decryptedPayload.state || null

    if (!order_id || !paywiseTxnId) {
      console.warn('[webhook] Malformed decrypted payload')
      return res.status(400).json({ error: 'Malformed payload' })
    }

    // Timestamp freshness (5 min window). Accept several timestamp fields
    const rawTs = decryptedPayload.timestamp || decryptedPayload.createdAt || decryptedPayload.timestamps?.updatedAt || null
    const ts = rawTs ? (isNaN(Number(rawTs)) ? Date.parse(rawTs) : Number(rawTs) * 1000) : Date.now()
    if (Number.isNaN(ts) || Math.abs(Date.now() - ts) > 15 * 60 * 1000) {
      console.warn('[webhook] Stale or invalid timestamp')
      return res.status(401).json({ error: 'Invalid or stale timestamp' })
    }

    // 3. Idempotency: wallet transaction already recorded?
    const existingWT = await prisma.walletTransaction.findUnique({ where: { paywiseTxnId } })
    if (existingWT) {
      console.info('[webhook] Already processed', { paywiseTxnId })
      return res.status(200).json({ received: true })
    }

    // 4. Load transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: order_id },
      include: { partner: true },
    })

    if (!transaction) {
      console.error('[webhook] Transaction not found', { order_id })
      return res.status(404).json({ error: 'Transaction not found' })
    }

    if (transaction.status !== 'PENDING') {
      console.info('[webhook] Already processed', { id: order_id, status: transaction.status })
      return res.status(200).json({ received: true })
    }

    // 5. Handle event
    if (event === 'payment.success' || status === 'success') {
      try {
        await completePayment({
          transactionId: order_id,
          paywiseTxnId,
          paymentMethod: payment_method,
          completedAt: new Date(ts),
        })
      } catch (err) {
        console.error('[webhook] completePayment error', err)
        return res.status(500).json({ error: 'Processing error' })
      }
      console.info('[webhook] payment.success processed', { transactionId: order_id })
    } else if (event === 'payment.failed' || status === 'failed') {
      try {
        await failPayment({
          transactionId: order_id,
          failureReason: failure_reason || status || 'failed',
        })
      } catch (err) {
        console.error('[webhook] failPayment error', err)
        return res.status(500).json({ error: 'Processing error' })
      }
      console.info('[webhook] payment.failed processed', { transactionId: order_id })
    } else {
      return res.status(400).json({ error: 'Unknown event' })
    }

    // 6. Notify partner (async; don't block Paywise response)
    const freshTxn = await prisma.transaction.findUnique({
      where: { id: order_id },
      include: { partner: true },
    })
    if (freshTxn) {
      partnerWebhookService.notifyPaymentStatus(freshTxn).catch((err) => {
        console.error('[webhook] Partner notification failed', { error: err.message })
      })
    }

    return res.status(200).json({ received: true })
  } catch (err) {
    console.error('[webhook] Unhandled error', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
})

export default router