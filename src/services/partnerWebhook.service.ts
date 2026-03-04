import axios from 'axios'
import crypto from 'crypto'
import prisma from '../config/database'
import { AppError, ErrorCodes } from '../utils/AppError'

// ---- Types ----

export interface WebhookDeliveryParams {
  url: string
  payload: Record<string, any>
  signature: string
  partnerId: string
  transactionId?: string | null
  settlementId?: string | null
}

// ---- Partner Webhook Service ----

class PartnerWebhookService {
  private readonly maxRetries = 3
  private readonly timeoutMs = 10_000

  /**
   * Notify partner about a payment status change.
   */
  async notifyPaymentStatus(transaction: {
    id: string
    partnerId: string
    userReference: string
    amount: any
    commission: any
    netAmount: any
    paymentMethod: any
    status: string
    completedAt: Date | null
    metadata: any
    partner?: { webhookUrl?: string | null; apiSecretEncrypted?: string | null }
  }) {
    const partner = transaction.partner
    if (!partner?.webhookUrl) {
      console.info('[partnerWebhook] Partner has no webhookUrl', { partnerId: transaction.partnerId })
      return
    }

    const payload: Record<string, any> = {
      event: transaction.status === 'SUCCESS' ? 'payment.success' : 'payment.failed',
      transaction_id: transaction.id,
      partner_id: transaction.partnerId,
      user_reference: transaction.userReference,
      amount: parseFloat(transaction.amount.toString()),
      commission: parseFloat(transaction.commission.toString()),
      net_amount: parseFloat(transaction.netAmount.toString()),
      payment_method: transaction.paymentMethod,
      status: transaction.status,
      timestamp: transaction.completedAt?.toISOString() ?? new Date().toISOString(),
      metadata: transaction.metadata,
    }

    const signature = this.generateSignature(payload, partner.apiSecretEncrypted || '')

    await this.deliverWebhook({
      url: partner.webhookUrl,
      payload,
      signature,
      partnerId: transaction.partnerId,
      transactionId: transaction.id,
    })
  }

  /**
   * Notify partner about a settlement status change.
   */
  async notifySettlementStatus(params: {
    settlementId: string
    partnerId: string
    amount: number
    status: string
    reason?: string
    webhookUrl: string
    apiSecret: string
  }) {
    const payload: Record<string, any> = {
      event: params.status === 'COMPLETED' ? 'settlement.completed' : 'settlement.failed',
      settlement_id: params.settlementId,
      partner_id: params.partnerId,
      amount: params.amount,
      status: params.status,
      reason: params.reason,
      timestamp: new Date().toISOString(),
    }

    const signature = this.generateSignature(payload, params.apiSecret)

    await this.deliverWebhook({
      url: params.webhookUrl,
      payload,
      signature,
      partnerId: params.partnerId,
      settlementId: params.settlementId,
    })
  }

  /**
   * Deliver a webhook with retry + exponential backoff.
   * Logs every attempt to `WebhookLog`.
   */
  async deliverWebhook(params: WebhookDeliveryParams): Promise<void> {
    let attempt = 0

    while (attempt < this.maxRetries) {
      attempt++
      try {
        const response = await axios.post(params.url, params.payload, {
          headers: {
            'X-Paycher-Signature': params.signature,
            'X-Paycher-Event': params.payload.event,
            'Content-Type': 'application/json',
          },
          timeout: this.timeoutMs,
        })

        await this.logAttempt({
          ...params,
          attempt,
          success: true,
          responseStatus: response.status,
          responseBody: response.data,
        })

        console.info('[partnerWebhook] delivered', {
          partnerId: params.partnerId,
          transactionId: params.transactionId,
          attempt,
        })
        return // success
      } catch (err: any) {
        await this.logAttempt({
          ...params,
          attempt,
          success: false,
          responseStatus: err.response?.status ?? null,
          responseBody: err.response?.data ?? null,
          errorMessage: err.message,
        })

        if (attempt < this.maxRetries) {
          await this.sleep(Math.pow(2, attempt) * 1000) // 2s, 4s
        } else {
          console.error('[partnerWebhook] failed after retries', {
            partnerId: params.partnerId,
            transactionId: params.transactionId,
            error: err.message,
          })
        }
      }
    }
  }

  // ---- helpers ----

  generateSignature(payload: Record<string, any>, secret: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')
  }

  private async logAttempt(p: WebhookDeliveryParams & {
    attempt: number
    success: boolean
    responseStatus?: number | null
    responseBody?: any
    errorMessage?: string
  }) {
    try {
      await prisma.webhookLog.create({
        data: {
          partnerId: p.partnerId,
          transactionId: p.transactionId ?? null,
          settlementId: p.settlementId ?? null,
          event: p.payload.event,
          url: p.url,
          payload: p.payload as any,
          responseStatus: p.responseStatus ?? null,
          responseBody: p.responseBody ?? null,
          errorMessage: p.errorMessage ?? null,
          attempt: p.attempt,
          success: p.success,
        },
      })
    } catch (logErr) {
      console.error('[partnerWebhook] failed to persist WebhookLog', logErr)
    }
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
  }
}

const partnerWebhookService = new PartnerWebhookService()
export default partnerWebhookService
