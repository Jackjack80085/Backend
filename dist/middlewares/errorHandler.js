"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AppError_1 = require("../utils/AppError");
function errorHandler(err, req, res, _next) {
    // AppError → structured response
    if (err instanceof AppError_1.AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                ...(err.details ? { details: err.details } : {}),
            },
        });
    }
    // Legacy errors that have a .status / .statusCode number
    const status = err.statusCode || err.status || 500;
    const message = status < 500 ? err.message : 'Internal Server Error';
    console.error('[errorHandler]', err);
    res.status(status).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message,
            debug: process.env.NODE_ENV !== 'production' ? { msg: err?.message, stack: err?.stack?.split('\n').slice(0, 5) } : undefined,
        },
    });
}
exports.default = errorHandler;
