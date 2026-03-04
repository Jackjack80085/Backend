import { Request, Response, NextFunction } from 'express'
import { kycDocumentService } from '../services/kycDocument.service'
import { AppError } from '../utils/AppError'
import path from 'path'
import fs from 'fs'

export class KYCDocumentController {
  async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const partnerId = (req as any).partner?.partnerId
      const { documentType } = req.body
      const file = req.file

      if (!partnerId) throw new AppError(401, 'Partner authentication required', 'UNAUTHORIZED')
      if (!file) throw new AppError(400, 'File is required', 'MISSING_FILE')
      if (!documentType) throw new AppError(400, 'Document type is required', 'MISSING_DOCUMENT_TYPE')

      const document = await kycDocumentService.uploadDocument({ partnerId, documentType, file })

      res.status(201).json({
        success: true,
        data: document,
      })
    } catch (err) {
      next(err)
    }
  }

  async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const partnerId = (req as any).partner?.partnerId
      if (!partnerId) throw new AppError(401, 'Partner authentication required', 'UNAUTHORIZED')

      const documents = await kycDocumentService.getPartnerDocuments(partnerId)

      res.json({
        success: true,
        data: documents,
      })
    } catch (err) {
      next(err)
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const partnerId = (req as any).partner?.partnerId
      const { id } = req.params

      if (!partnerId) throw new AppError(401, 'Partner authentication required', 'UNAUTHORIZED')

      await kycDocumentService.deleteDocument(id as string, partnerId)

      res.json({
        success: true,
        message: 'Document deleted successfully',
      })
    } catch (err) {
      next(err)
    }
  }

  async getPartnerDocumentsAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { partnerId } = req.params

      const documents = await kycDocumentService.getPartnerDocuments(partnerId as string)

      const requiredTypes = ['BUSINESS_REGISTRATION', 'PAN_CARD', 'GST_CERTIFICATE', 'BANK_PROOF']
      const uploadedTypes = documents.map((d: any) => d.documentType)
      const allRequiredUploaded = requiredTypes.every(type => uploadedTypes.includes(type))
      const missingTypes = requiredTypes.filter(type => !uploadedTypes.includes(type))

      res.json({
        success: true,
        data: documents,
        meta: {
          allRequiredUploaded,
          missingTypes,
          requiredCount: requiredTypes.length,
          uploadedRequiredCount: requiredTypes.filter(type => uploadedTypes.includes(type)).length,
        },
      })
    } catch (err) {
      next(err)
    }
  }

  async getDocumentFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const document = await kycDocumentService.getDocumentById(id as string)
      if (!document) throw new AppError(404, 'Document not found', 'DOCUMENT_NOT_FOUND')

      const filePath = document.fileUrl
      if (!filePath || !fs.existsSync(filePath)) {
        throw new AppError(404, 'File not found on server', 'FILE_NOT_FOUND')
      }

      return res.sendFile(path.resolve(filePath))
    } catch (err) {
      next(err)
    }
  }

  async reviewDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { status, rejectionReason } = req.body
      const adminId = (req as any).admin?.adminId || (req as any).user?.adminId

      if (!status || !['APPROVED', 'REJECTED'].includes(status)) throw new AppError(400, 'Valid status required (APPROVED/REJECTED)', 'INVALID_STATUS')
      if (status === 'REJECTED' && !rejectionReason) throw new AppError(400, 'Rejection reason required', 'MISSING_REASON')

      await kycDocumentService.reviewDocument({ documentId: id as string, adminId, status, rejectionReason })

      res.json({
        success: true,
        message: `Document ${status.toLowerCase()} successfully`,
      })
    } catch (err) {
      next(err)
    }
  }
}

export const kycDocumentController = new KYCDocumentController()
