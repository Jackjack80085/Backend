import { BadRequestError } from './errors'

export function validateDateRange(from?: string, to?: string, defaultDays = 30) {
  const now = new Date()
  const toDate = to ? new Date(to) : now
  const fromDate = from ? new Date(from) : new Date(now.getTime() - defaultDays * 24 * 60 * 60 * 1000)

  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) throw new BadRequestError('Invalid date')
  if (fromDate > toDate) throw new BadRequestError('fromDate must be before toDate')
  const rangeDays = (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000)
  if (rangeDays > 365) throw new BadRequestError('Date range too large')
  return { fromDate, toDate }
}
