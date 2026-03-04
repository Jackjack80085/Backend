"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadConfig = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
exports.uploadConfig = {
    kycDir: path_1.default.join(process.cwd(), 'uploads', 'kyc'),
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png'],
};
// Ensure upload directory exists
if (!fs_1.default.existsSync(exports.uploadConfig.kycDir)) {
    fs_1.default.mkdirSync(exports.uploadConfig.kycDir, { recursive: true });
}
