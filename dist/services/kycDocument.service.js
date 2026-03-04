"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.kycDocumentService = exports.KYCDocumentService = void 0;
const fs_1 = __importDefault(require("fs"));
const database_1 = __importDefault(require("../config/database"));
const AppError_1 = require("../utils/AppError");
const email_service_1 = require("./email.service");
const auditLog_service_1 = require("./auditLog.service");
const partnerService_1 = require("./partnerService");
class KYCDocumentService {
    async uploadDocument(params) {
        const partner = await database_1.default.partner.findUnique({ where: { id: params.partnerId } });
        if (!partner)
            throw new AppError_1.AppError(404, 'Partner not found', 'PARTNER_NOT_FOUND');
        const allowedStatuses = ['REGISTERED', 'KYC_PENDING', 'KYC_REJECTED'];
        const allowedKycStatuses = ['PENDING', 'SUBMITTED', 'REJECTED'];
        if (!allowedStatuses.includes(partner.status) && !allowedKycStatuses.includes(partner.kycStatus)) {
            throw new AppError_1.AppError(400, 'KYC documents can only be uploaded before approval', 'INVALID_STATUS');
        }
        const existing = await database_1.default.kYCDocument.findFirst({
            where: {
                partnerId: params.partnerId,
                documentType: params.documentType,
                status: 'APPROVED',
            },
        });
        if (existing)
            throw new AppError_1.AppError(400, 'This document type is already approved', 'DOCUMENT_APPROVED');
        const document = await database_1.default.kYCDocument.create({
            data: {
                partnerId: params.partnerId,
                documentType: params.documentType,
                fileName: params.file.originalname,
                fileUrl: params.file.path,
                fileSize: params.file.size,
                mimeType: params.file.mimetype,
                status: 'PENDING',
            },
        });
        await database_1.default.partner.update({
            where: { id: params.partnerId },
            data: {
                kycStatus: 'SUBMITTED',
                kycSubmittedAt: new Date(),
                status: 'KYC_PENDING',
            },
        });
        // Audit log: document uploaded
        try {
            await auditLog_service_1.auditLogService.log({
                action: 'KYC_DOCUMENT_UPLOADED',
                actorType: 'PARTNER',
                actorId: params.partnerId,
                targetType: 'DOCUMENT',
                targetId: document.id,
                description: `Uploaded ${params.documentType}`,
                metadata: { fileName: params.file.originalname, fileSize: params.file.size },
            });
        }
        catch (err) {
            console.warn('Failed to write audit log for KYC upload', err);
        }
        return document;
    }
    async getPartnerDocuments(partnerId) {
        return await database_1.default.kYCDocument.findMany({
            where: { partnerId },
            orderBy: { uploadedAt: 'desc' },
        });
    }
    async getDocumentById(documentId) {
        return await database_1.default.kYCDocument.findUnique({ where: { id: documentId } });
    }
    async reviewDocument(params) {
        const document = await database_1.default.kYCDocument.findUnique({
            where: { id: params.documentId },
            include: { partner: true },
        });
        if (!document)
            throw new AppError_1.AppError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
        await database_1.default.kYCDocument.update({
            where: { id: params.documentId },
            data: {
                status: params.status,
                reviewedAt: new Date(),
                reviewedBy: params.adminId,
                rejectionReason: params.rejectionReason,
            },
        });
        const allDocuments = await database_1.default.kYCDocument.findMany({
            where: { partnerId: document.partnerId },
        });
        const requiredTypes = ['BUSINESS_REGISTRATION', 'PAN_CARD', 'GST_CERTIFICATE', 'BANK_PROOF'];
        const approvedTypes = allDocuments.filter((d) => d.status === 'APPROVED').map((d) => d.documentType);
        const allApproved = requiredTypes.every(type => approvedTypes.includes(type));
        if (allApproved) {
            await this.approvePartnerKYC(document.partnerId, params.adminId);
        }
        else if (params.status === 'REJECTED') {
            await database_1.default.partner.update({
                where: { id: document.partnerId },
                data: {
                    kycStatus: 'REJECTED',
                    status: 'KYC_REJECTED',
                },
            });
            // Send rejection email and audit log
            try {
                await email_service_1.emailService.sendKYCRejected({
                    email: document.partner.email,
                    businessName: document.partner.businessName,
                    rejectionReason: params.rejectionReason || 'Document verification failed',
                });
            }
            catch (err) {
                console.warn('Failed to send KYC rejection email', err);
            }
            try {
                await auditLog_service_1.auditLogService.log({
                    action: 'KYC_DOCUMENT_REJECTED',
                    actorType: 'ADMIN',
                    actorId: params.adminId,
                    targetType: 'DOCUMENT',
                    targetId: params.documentId,
                    description: `Document ${document.documentType} rejected`,
                    metadata: { rejectionReason: params.rejectionReason },
                });
            }
            catch (err) {
                console.warn('Failed to write audit log for KYC rejection', err);
            }
        }
        return { success: true };
    }
    async approvePartnerKYC(partnerId, adminId) {
        await database_1.default.partner.update({
            where: { id: partnerId },
            data: {
                kycStatus: 'APPROVED',
                kycApprovedAt: new Date(),
                kycReviewedAt: new Date(),
                kycReviewedBy: adminId,
                status: 'ACTIVE',
            },
        });
        console.log('\n✅ Partner KYC Approved!');
        console.log('Partner ID:', partnerId);
        console.log('API credentials can now be issued.\n');
        // Issue API credentials and notify partner
        try {
            const partner = await database_1.default.partner.findUnique({ where: { id: partnerId } });
            if (partner) {
                const credentials = await (0, partnerService_1.issueApiCredentials)(partnerId);
                try {
                    await email_service_1.emailService.sendKYCApproved({
                        email: partner.email,
                        businessName: partner.businessName,
                        apiKey: credentials.apiKey,
                        apiSecret: credentials.apiSecret,
                    });
                }
                catch (err) {
                    console.warn('Failed to send KYC approved email', err);
                }
                try {
                    await auditLog_service_1.auditLogService.log({
                        action: 'KYC_APPROVED',
                        actorType: 'ADMIN',
                        actorId: adminId,
                        targetType: 'PARTNER',
                        targetId: partnerId,
                        description: `KYC approved for ${partner.businessName}`,
                        metadata: { kycApprovedAt: new Date() },
                    });
                }
                catch (err) {
                    console.warn('Failed to write audit log for KYC approved', err);
                }
            }
        }
        catch (err) {
            console.error('Error issuing credentials or notifying partner on KYC approve', err);
        }
    }
    async deleteDocument(documentId, partnerId) {
        const document = await database_1.default.kYCDocument.findUnique({ where: { id: documentId } });
        if (!document)
            throw new AppError_1.AppError(404, 'Document not found', 'DOCUMENT_NOT_FOUND');
        if (document.partnerId !== partnerId)
            throw new AppError_1.AppError(403, 'Not authorized', 'FORBIDDEN');
        if (document.status === 'APPROVED')
            throw new AppError_1.AppError(400, 'Cannot delete approved document', 'DOCUMENT_APPROVED');
        if (fs_1.default.existsSync(document.fileUrl)) {
            fs_1.default.unlinkSync(document.fileUrl);
        }
        await database_1.default.kYCDocument.delete({ where: { id: documentId } });
        return { success: true };
    }
}
exports.KYCDocumentService = KYCDocumentService;
exports.kycDocumentService = new KYCDocumentService();
