import { Router, Request, Response, NextFunction } from 'express'
import { partnerAuthController } from '../../controllers/partnerAuth.controller'

const router = Router()

router.post(
  '/login',
  (req: Request, res: Response, next: NextFunction) => partnerAuthController.login(req, res, next)
)

export default router
