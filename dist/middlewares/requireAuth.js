"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = require("../utils/AppError");
function requireAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new AppError_1.AppError(401, 'Authentication required', 'UNAUTHORIZED');
        }
        const token = authHeader.substring(7);
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || '');
        req.user = {
            id: decoded.partnerId || decoded.adminId,
            partnerId: decoded.partnerId,
            adminId: decoded.adminId,
            email: decoded.email,
            status: decoded.status,
            role: decoded.role,
        };
        next();
    }
    catch (err) {
        next(new AppError_1.AppError(401, 'Invalid or expired token', 'UNAUTHORIZED'));
    }
}
