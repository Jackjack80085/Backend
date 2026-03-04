/**
 * Standardized application error.
 * All thrown errors should use this class so the error handler can
 * produce a uniform JSON response.
 */
export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly details?: any

  constructor(statusCode: number, message: string, code: string, details?: any) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

// ---- Pre-built factory helpers ----

export const ErrorCodes = {
  INVALID_API_KEY: 'INVALID_API_KEY',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TRANSACTION_NOT_FOUND: 'TRANSACTION_NOT_FOUND',
  PAYMENT_EXPIRED: 'PAYMENT_EXPIRED',
  SETTLEMENT_ALREADY_PROCESSED: 'SETTLEMENT_ALREADY_PROCESSED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  PAYWISE_ERROR: 'PAYWISE_ERROR',
  PARTNER_INACTIVE: 'PARTNER_INACTIVE',
  PARTNER_KYC_NOT_APPROVED: 'PARTNER_KYC_NOT_APPROVED',
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  PLATFORM_WALLET_MISSING: 'PLATFORM_WALLET_MISSING',
  WEBHOOK_DELIVERY_FAILED: 'WEBHOOK_DELIVERY_FAILED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]
