import './env'

export const NODE_ENV: 'development' | 'production' | 'test' =
  (process.env.NODE_ENV as any) || 'development'

export const PORT: number = parseInt(process.env.PORT || '3000', 10)

export const MAX_TRANSACTION_AMOUNT: number = parseFloat(process.env.MAX_TRANSACTION_AMOUNT || '100000')
export const TRANSACTION_EXPIRES_MINUTES: number = parseInt(process.env.TRANSACTION_EXPIRES_MINUTES || '30', 10)
export const GLOBAL_MIN_SETTLEMENT_AMOUNT: number = parseFloat(process.env.GLOBAL_MIN_SETTLEMENT_AMOUNT || '100')
export const SETTLEMENT_FEE: number = parseFloat(process.env.SETTLEMENT_FEE || '10')

export default {
  NODE_ENV,
  PORT,
  MAX_TRANSACTION_AMOUNT,
  TRANSACTION_EXPIRES_MINUTES,
  GLOBAL_MIN_SETTLEMENT_AMOUNT,
  SETTLEMENT_FEE,
}
