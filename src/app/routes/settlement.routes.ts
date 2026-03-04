import { Router, Request, Response, NextFunction } from 'express'
import authenticatePartner from '../../middlewares/authenticatePartner'
import { validate, settlementRequestSchema } from '../../middlewares/validation.middleware'
import { rateLimit } from '../../middlewares/rateLimit.middleware'
import { createSettlement } from '../../services/settlementService'
import { markSettlementAsProcessing, completeSettlement } from '../../services/settlementProcessingService'
import requireAdmin from '../../middlewares/requireAdmin'

const router = Router()

// ---- Partner settlement endpoints ----

/**
 * @swagger
 * /api/v1/settlements/request:
 *   post:
 *     summary: Request a settlement (partner)
 *     tags: [Settlements]
 *     security:
 *       - ApiKeyAuth: []
 *       - SignatureAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 500.00
 *               metadata:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settlement requested
 *       400:
 *         description: Validation or business rule error
 *       401:
 *         description: Authentication failed
 */
router.post(
  '/request',
  authenticatePartner,
  rateLimit('payment'),
  validate(settlementRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const partner = (req as any).partner
      const { amount, metadata } = req.body
      const result = await createSettlement(partner, amount, metadata)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
)

// ---- Admin settlement endpoints ----

/**
 * @swagger
 * /api/v1/settlements/{settlementId}/process:
 *   post:
 *     summary: Mark a settlement as processing (admin)
 *     tags: [Settlements]
 *     parameters:
 *       - in: path
 *         name: settlementId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Settlement marked as processing
 */
router.post(
  '/:settlementId/process',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = (req as any).user
      const result = await markSettlementAsProcessing(req.params.settlementId as string, admin)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
)

/**
 * @swagger
 * /api/v1/settlements/{settlementId}/complete:
 *   post:
 *     summary: Complete or fail a settlement (admin)
 *     tags: [Settlements]
 *     parameters:
 *       - in: path
 *         name: settlementId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [result]
 *             properties:
 *               result:
 *                 type: string
 *                 enum: [SUCCESS, FAILED]
 *               bankReferenceId:
 *                 type: string
 *               failureReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settlement completed
 */
router.post(
  '/:settlementId/complete',
  requireAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const admin = (req as any).user
      const result = await completeSettlement(req.params.settlementId as string, req.body, admin)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
)

export default router
