"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kycDocumentController = exports.KYCDocumentController = void 0;
const kycDocument_service_1 = require("../services/kycDocument.service");
const AppError_1 = require("../utils/AppError");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
class KYCDocumentController {
    async uploadDocument(req, res, next) {
        try {
            const partnerId = req.partner?.partnerId;
            const { documentType } = req.body;
            const file = req.file;
            if (!partnerId)
                throw new AppError_1.AppError(401, 'Partner authentication required', 'UNAUTHORIZED');
            if (!file)
                throw new AppError_1.AppError(400, 'File is required', 'MISSING_FILE');
            if (!documentType)
                throw new AppError_1.AppError(400, 'Document type is required', 'MISSING_DOCUMENT_TYPE');
            const document = await kycDocument_service_1.kycDocumentService.uploadDocument({ partnerId, documentType, file });
            res.status(201).json({
                success: true,
                data: document,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getDocuments(req, res, next) {
        try {
            const partnerId = req.partner?.partnerId;
            if (!partnerId)
                throw new AppError_1.AppError(401, 'Partner authentication required', 'UNAUTHORIZED');
            const documents = await kycDocument_service_1.kycDocumentService.getPartnerDocuments(partnerId);
            res.json({
                success: true,
                data: documents,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async deleteDocument(req, res, next) {
        try {
            const partnerId = req.partner?.partnerId;
            const { id } = req.params;
            if (!partnerId)
                throw new AppError_1.AppError(401, 'Partner authentication required', 'UNAUTHORIZED');
            await kycDocument_service_1.kycDocumentService.deleteDocument(id, partnerId);
            res.json({
                success: true,
                message: 'Document deleted successfully',
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getPartnerDocumentsAdmin(req, res, next) {
        try {
            const { partnerId } = req.params;
            const documents = await kycDocument_service_1.kycDocumentService.getPartnerDocuments(partnerId);
            const requiredTypes = ['BUSINESS_REGISTRATION', 'PAN_CARD', 'GST_CERTIFICATE', 'BANK_PROOF'];
            const uploadedTypes = documents.map((d) => d.documentType);
            const allRequiredUploaded = requiredTypes.every(type => uploadedTypes.includes(type));
            const missingTypes = requiredTypes.filter(type => !uploadedTypes.includes(type));
            res.json({
                success: true,
                data: documents,
                meta: {
                    allRequiredUploaded,
                    missingTypes,
                    requiredCount: requiredTypes.length,
                    uploadedRequiredCount: requiredTypes.filter(type => uploadedTypes.includes(type)).length,
                },
            });
        }
        catch (err) {
            next(err);
        }
    }
    async getDocumentFile(req, res, next) {
        try {
            const { id } = req.params;
            const document = await kycDocument_service_1.kycDocumentService.getDocumentById(id);
            if (!document)
                throw new AppError_1.AppError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
            const filePath = document.fileUrl;
            if (!filePath || !fs_1.default.existsSync(filePath)) {
                throw new AppError_1.AppError(404, 'File not found on server', 'FILE_NOT_FOUND');
            }
            return res.sendFile(path_1.default.resolve(filePath));
        }
        catch (err) {
            next(err);
        }
    }
    async reviewDocument(req, res, next) {
        try {
            const { id } = req.params;
            const { status, rejectionReason } = req.body;
            const adminId = req.admin?.adminId || req.user?.adminId;
            if (!status || !['APPROVED', 'REJECTED'].includes(status))
                throw new AppError_1.AppError(400, 'Valid status required (APPROVED/REJECTED)', 'INVALID_STATUS');
            if (status === 'REJECTED' && !rejectionReason)
                throw new AppError_1.AppError(400, 'Rejection reason required', 'MISSING_REASON');
            await kycDocument_service_1.kycDocumentService.reviewDocument({ documentId: id, adminId, status, rejectionReason });
            res.json({
                success: true,
                message: `Document ${status.toLowerCase()} successfully`,
            });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.KYCDocumentController = KYCDocumentController;
exports.kycDocumentController = new KYCDocumentController();
