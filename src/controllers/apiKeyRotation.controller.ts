import { Request, Response, NextFunction } from 'express'
import { apiKeyRotationService } from '../services/apiKeyRotation.service'
import { AppError } from '../utils/AppError'

export const rotateOwnKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partnerId = (req as any).partner?.partnerId
    if (!partnerId) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED')
    const { reason } = req.body

    const result = await apiKeyRotationService.rotateApiKey(partnerId, reason || 'Partner requested rotation')
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export const rotatePartnerKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { partnerId } = req.params
    if (!partnerId) throw new AppError(400, 'Partner ID required', 'MISSING_PARTNER_ID')

    const result = await apiKeyRotationService.rotateApiKey(partnerId as string, `Admin rotation: ${req.user?.email}`)
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export const revokePartnerKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { partnerId } = req.params
    const { reason } = req.body
    if (!partnerId) throw new AppError(400, 'Partner ID required', 'MISSING_PARTNER_ID')

    const result = await apiKeyRotationService.revokeApiKey(partnerId as string, reason || 'Admin revocation')
    res.json({ success: true, data: result })
  } catch (error) {
    next(error)
  }
}

export const getRotationHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const partnerId = req.user?.partnerId || req.user?.adminId
    if (!partnerId) throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED')

    const history = await apiKeyRotationService.getRotationHistory(partnerId)
    res.json({ success: true, data: history })
  } catch (error) {
    next(error)
  }
}

export const getPartnerRotationHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { partnerId } = req.params
    if (!partnerId) throw new AppError(400, 'Partner ID required', 'MISSING_PARTNER_ID')

    const history = await apiKeyRotationService.getRotationHistory(partnerId as string)
    res.json({ success: true, data: history })
  } catch (error) {
    next(error)
  }
}
