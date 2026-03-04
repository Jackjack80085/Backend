"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForbiddenError = exports.BadRequestError = void 0;
class BadRequestError extends Error {
    constructor(message) {
        super(message || 'Bad Request');
        this.status = 400;
        this.name = 'BadRequestError';
    }
}
exports.BadRequestError = BadRequestError;
class ForbiddenError extends Error {
    constructor(message) {
        super(message || 'Forbidden');
        this.status = 403;
        this.name = 'ForbiddenError';
    }
}
exports.ForbiddenError = ForbiddenError;
