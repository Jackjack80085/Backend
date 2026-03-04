"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticatePartner_1 = __importDefault(require("../../middlewares/authenticatePartner"));
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const rateLimit_middleware_1 = require("../../middlewares/rateLimit.middleware");
const settlementService_1 = require("../../services/settlementService");
const settlementProcessingService_1 = require("../../services/settlementProcessingService");
const requireAdmin_1 = __importDefault(require("../../middlewares/requireAdmin"));
const router = (0, express_1.Router)();
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
router.post('/request', authenticatePartner_1.default, (0, rateLimit_middleware_1.rateLimit)('payment'), (0, validation_middleware_1.validate)(validation_middleware_1.settlementRequestSchema), async (req, res, next) => {
    try {
        const partner = req.partner;
        const { amount, metadata } = req.body;
        const result = await (0, settlementService_1.createSettlement)(partner, amount, metadata);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
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
router.post('/:settlementId/process', requireAdmin_1.default, async (req, res, next) => {
    try {
        const admin = req.user;
        const result = await (0, settlementProcessingService_1.markSettlementAsProcessing)(req.params.settlementId, admin);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
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
router.post('/:settlementId/complete', requireAdmin_1.default, async (req, res, next) => {
    try {
        const admin = req.user;
        const result = await (0, settlementProcessingService_1.completeSettlement)(req.params.settlementId, req.body, admin);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
