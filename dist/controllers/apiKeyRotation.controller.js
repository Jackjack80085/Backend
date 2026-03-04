"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPartnerRotationHistory = exports.getRotationHistory = exports.revokePartnerKey = exports.rotatePartnerKey = exports.rotateOwnKey = void 0;
const apiKeyRotation_service_1 = require("../services/apiKeyRotation.service");
const AppError_1 = require("../utils/AppError");
const rotateOwnKey = async (req, res, next) => {
    try {
        const partnerId = req.partner?.partnerId;
        if (!partnerId)
            throw new AppError_1.AppError(401, 'Unauthorized', 'UNAUTHORIZED');
        const { reason } = req.body;
        const result = await apiKeyRotation_service_1.apiKeyRotationService.rotateApiKey(partnerId, reason || 'Partner requested rotation');
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.rotateOwnKey = rotateOwnKey;
const rotatePartnerKey = async (req, res, next) => {
    try {
        const { partnerId } = req.params;
        if (!partnerId)
            throw new AppError_1.AppError(400, 'Partner ID required', 'MISSING_PARTNER_ID');
        const result = await apiKeyRotation_service_1.apiKeyRotationService.rotateApiKey(partnerId, `Admin rotation: ${req.user?.email}`);
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.rotatePartnerKey = rotatePartnerKey;
const revokePartnerKey = async (req, res, next) => {
    try {
        const { partnerId } = req.params;
        const { reason } = req.body;
        if (!partnerId)
            throw new AppError_1.AppError(400, 'Partner ID required', 'MISSING_PARTNER_ID');
        const result = await apiKeyRotation_service_1.apiKeyRotationService.revokeApiKey(partnerId, reason || 'Admin revocation');
        res.json({ success: true, data: result });
    }
    catch (error) {
        next(error);
    }
};
exports.revokePartnerKey = revokePartnerKey;
const getRotationHistory = async (req, res, next) => {
    try {
        const partnerId = req.user?.partnerId || req.user?.adminId;
        if (!partnerId)
            throw new AppError_1.AppError(401, 'Unauthorized', 'UNAUTHORIZED');
        const history = await apiKeyRotation_service_1.apiKeyRotationService.getRotationHistory(partnerId);
        res.json({ success: true, data: history });
    }
    catch (error) {
        next(error);
    }
};
exports.getRotationHistory = getRotationHistory;
const getPartnerRotationHistory = async (req, res, next) => {
    try {
        const { partnerId } = req.params;
        if (!partnerId)
            throw new AppError_1.AppError(400, 'Partner ID required', 'MISSING_PARTNER_ID');
        const history = await apiKeyRotation_service_1.apiKeyRotationService.getRotationHistory(partnerId);
        res.json({ success: true, data: history });
    }
    catch (error) {
        next(error);
    }
};
exports.getPartnerRotationHistory = getPartnerRotationHistory;
