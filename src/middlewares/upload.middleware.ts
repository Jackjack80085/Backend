import multer from 'multer'
import path from 'path'
import crypto from 'crypto'
import { uploadConfig } from '../config/upload.config'
import { AppError } from '../utils/AppError'

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadConfig.kycDir)
  },
  filename: (req, file, cb) => {
    const partnerId = (req as any).partner?.partnerId || 'unknown'
    const timestamp = Date.now()
    const random = crypto.randomBytes(4).toString('hex')
    const ext = path.extname(file.originalname)
    const filename = `${partnerId}_${timestamp}_${random}${ext}`
    cb(null, filename)
  },
})

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
    return cb(new AppError(400, 'Invalid file type. Only PDF, JPG, PNG allowed', 'INVALID_FILE_TYPE') as any)
  }
  cb(null, true)
}

export const uploadKYC = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: uploadConfig.maxFileSize,
  },
})
