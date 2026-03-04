import { Request, Response, NextFunction } from 'express'

export default function requirePartner(req: Request, res: Response, next: NextFunction) {
  const partner = (req as any).partner
  if (!partner) {
    return res.status(401).json({ error: 'Partner authentication required' })
  }
  return next()
}
