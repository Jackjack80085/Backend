"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function notFound(req, res, next) {
    res.status(404).json({ error: 'Not Found' });
}
exports.default = notFound;
