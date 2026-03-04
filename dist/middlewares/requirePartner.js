"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = requirePartner;
function requirePartner(req, res, next) {
    const partner = req.partner;
    if (!partner) {
        return res.status(401).json({ error: 'Partner authentication required' });
    }
    return next();
}
