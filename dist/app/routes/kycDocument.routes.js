"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const kycDocument_controller_1 = require("../../controllers/kycDocument.controller");
const upload_middleware_1 = require("../../middlewares/upload.middleware");
const router = (0, express_1.Router)();
// Partner middleware to verify JWT
function requirePartner(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, error: 'Partner authentication required' });
            return;
        }
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
        req.partner = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
}
function requireAdmin(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ success: false, error: 'Admin authentication required' });
            return;
        }
        const token = authHeader.substring(7);
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
        if (decoded.role !== 'SUPER_ADMIN' && decoded.role !== 'ADMIN') {
            res.status(403).json({ success: false, error: 'Admin access required' });
            return;
        }
        ;
        req.admin = decoded;
        next();
    }
    catch (err) {
        res.status(401).json({ success: false, error: 'Invalid token' });
    }
}
// Partner routes
router.post('/partner/kyc-documents', requirePartner, upload_middleware_1.uploadKYC.single('file'), (req, res, next) => kycDocument_controller_1.kycDocumentController.uploadDocument(req, res, next));
router.get('/partner/kyc-documents', requirePartner, (req, res, next) => kycDocument_controller_1.kycDocumentController.getDocuments(req, res, next));
router.delete('/partner/kyc-documents/:id', requirePartner, (req, res, next) => kycDocument_controller_1.kycDocumentController.deleteDocument(req, res, next));
// Admin routes
router.get('/admin/partners/:partnerId/kyc', requireAdmin, (req, res, next) => kycDocument_controller_1.kycDocumentController.getPartnerDocumentsAdmin(req, res, next));
// Serve file (partner/admin access)
router.get('/admin/kyc-documents/:id/file', requireAdmin, (req, res, next) => kycDocument_controller_1.kycDocumentController.getDocumentFile(req, res, next));
router.get('/partner/kyc-documents/:id/file', requirePartner, (req, res, next) => kycDocument_controller_1.kycDocumentController.getDocumentFile(req, res, next));
router.post('/admin/kyc-documents/:id/review', requireAdmin, (req, res, next) => kycDocument_controller_1.kycDocumentController.reviewDocument(req, res, next));
exports.default = router;
