import path from 'path'
import fs from 'fs'

export const uploadConfig = {
  kycDir: path.join(process.cwd(), 'uploads', 'kyc'),
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
}

// Ensure upload directory exists
if (!fs.existsSync(uploadConfig.kycDir)) {
  fs.mkdirSync(uploadConfig.kycDir, { recursive: true })
}
