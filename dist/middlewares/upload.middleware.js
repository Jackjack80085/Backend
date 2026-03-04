"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadKYC = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const upload_config_1 = require("../config/upload.config");
const AppError_1 = require("../utils/AppError");
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, upload_config_1.uploadConfig.kycDir);
    },
    filename: (req, file, cb) => {
        const partnerId = req.partner?.partnerId || 'unknown';
        const timestamp = Date.now();
        const random = crypto_1.default.randomBytes(4).toString('hex');
        const ext = path_1.default.extname(file.originalname);
        const filename = `${partnerId}_${timestamp}_${random}${ext}`;
        cb(null, filename);
    },
});
const fileFilter = (_req, file, cb) => {
    if (!upload_config_1.uploadConfig.allowedMimeTypes.includes(file.mimetype)) {
        return cb(new AppError_1.AppError(400, 'Invalid file type. Only PDF, JPG, PNG allowed', 'INVALID_FILE_TYPE'));
    }
    cb(null, true);
};
exports.uploadKYC = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: upload_config_1.uploadConfig.maxFileSize,
    },
});
