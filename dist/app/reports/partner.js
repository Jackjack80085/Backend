"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../../config/database"));
const dateRange_1 = require("../../utils/dateRange");
const router = (0, express_1.Router)();
// JWT middleware that loads full partner with wallet relation
router.use(async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Partner authentication required' });
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || '');
        const partner = await database_1.default.partner.findUnique({
            where: { id: decoded.partnerId },
            include: { wallet: true }
        });
        if (!partner)
            return res.status(404).json({ error: 'Partner not found' });
        req.partner = partner;
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});
router.get('/earnings', async (req, res) => {
    const partner = req.partner;
    try {
        const { fromDate, toDate } = (0, dateRange_1.validateDateRange)(req.query.from, req.query.to);
        const walletId = partner.wallet?.id;
        let totalEarned = 0;
        let totalWithdrawn = 0;
        if (walletId) {
            const earnedRow = await database_1.default.$queryRawUnsafe(`
        SELECT COALESCE(SUM(CASE WHEN "type"='CREDIT' AND "reason"='PAYMENT' THEN amount ELSE 0 END),0) AS total_earned,
               COALESCE(SUM(CASE WHEN "type"='DEBIT' AND "reason"='SETTLEMENT' THEN amount ELSE 0 END),0) AS total_withdrawn
        FROM "WalletTransaction" WHERE "walletId" = $1::uuid AND "createdAt" >= $2 AND "createdAt" <= $3
      `, walletId, fromDate, toDate);
            totalEarned = parseFloat(earnedRow?.[0]?.total_earned?.toString() || earnedRow?.total_earned?.toString() || '0');
            totalWithdrawn = parseFloat(earnedRow?.[0]?.total_withdrawn?.toString() || earnedRow?.total_withdrawn?.toString() || '0');
        }
        // Also sum from Transaction table for totalPayin (gross) and totalCommission
        const txnAgg = await database_1.default.$queryRawUnsafe(`
      SELECT COALESCE(SUM(CASE WHEN status='SUCCESS' THEN amount ELSE 0 END),0) AS total_payin,
             COALESCE(SUM(CASE WHEN status='SUCCESS' THEN commission ELSE 0 END),0) AS total_commission,
             COUNT(CASE WHEN status='PENDING' THEN 1 END) AS pending_count,
             COUNT(CASE WHEN status='SUCCESS' THEN 1 END) AS success_count
      FROM "Transaction" WHERE "partnerId" = $1::uuid AND "createdAt" >= $2 AND "createdAt" <= $3
    `, partner.id, fromDate, toDate);
        const row = Array.isArray(txnAgg) ? txnAgg[0] : txnAgg;
        const wallet = partner.wallet;
        const pendingSettlementsRow = await database_1.default.settlement.aggregate({ where: { partnerId: partner.id, status: 'PENDING' }, _sum: { totalDeducted: true } });
        const pendingSettlements = pendingSettlementsRow._sum.totalDeducted ? parseFloat(pendingSettlementsRow._sum.totalDeducted.toString()) : 0;
        const currentBalance = wallet ? parseFloat(wallet.balance.toString()) : 0;
        const availableBalance = currentBalance - pendingSettlements;
        res.json({
            summary: {
                totalEarned,
                totalWithdrawn,
                currentBalance,
                pendingSettlements,
                availableBalance,
                totalPayin: parseFloat(row?.total_payin?.toString() || '0'),
                totalCommission: parseFloat(row?.total_commission?.toString() || '0'),
                pendingTransactions: parseInt(row?.pending_count?.toString() || '0'),
                successTransactions: parseInt(row?.success_count?.toString() || '0'),
            },
            breakdown: []
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/settlements', async (req, res) => {
    const partner = req.partner;
    try {
        const filters = { partnerId: partner.id };
        if (req.query.status)
            filters.status = req.query.status;
        if (req.query.minAmount || req.query.maxAmount) {
            filters.amount = {};
            if (req.query.minAmount)
                filters.amount.gte = parseFloat(req.query.minAmount);
            if (req.query.maxAmount)
                filters.amount.lte = parseFloat(req.query.maxAmount);
        }
        const { fromDate, toDate } = (0, dateRange_1.validateDateRange)(req.query.from, req.query.to);
        filters.createdAt = { gte: fromDate, lte: toDate };
        const page = parseInt(req.query.page || '1', 10);
        const per = parseInt(req.query.per || '20', 10);
        const [items, total] = await Promise.all([
            database_1.default.settlement.findMany({ where: filters, orderBy: { createdAt: 'desc' }, skip: (page - 1) * per, take: per }),
            database_1.default.settlement.count({ where: filters })
        ]);
        res.json({ data: items, total, page, per });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.get('/transactions', async (req, res) => {
    const partner = req.partner;
    try {
        const filters = { partnerId: partner.id };
        if (req.query.status)
            filters.status = req.query.status;
        const { fromDate, toDate } = (0, dateRange_1.validateDateRange)(req.query.from, req.query.to);
        filters.createdAt = { gte: fromDate, lte: toDate };
        const page = parseInt(req.query.page || '1', 10);
        const per = parseInt(req.query.per || '20', 10);
        const [items, total] = await Promise.all([
            database_1.default.transaction.findMany({
                where: filters,
                orderBy: { createdAt: 'desc' },
                skip: (page - 1) * per,
                take: per,
                select: {
                    id: true,
                    amount: true,
                    commission: true,
                    netAmount: true,
                    status: true,
                    paymentMethod: true,
                    userReference: true,
                    createdAt: true,
                    completedAt: true,
                    failureReason: true,
                }
            }),
            database_1.default.transaction.count({ where: filters })
        ]);
        res.json({ data: items, total, page, per });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
