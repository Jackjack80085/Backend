"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SETTLEMENT_FEE = exports.GLOBAL_MIN_SETTLEMENT_AMOUNT = exports.TRANSACTION_EXPIRES_MINUTES = exports.MAX_TRANSACTION_AMOUNT = exports.PORT = exports.NODE_ENV = void 0;
require("./env");
exports.NODE_ENV = process.env.NODE_ENV || 'development';
exports.PORT = parseInt(process.env.PORT || '3000', 10);
exports.MAX_TRANSACTION_AMOUNT = parseFloat(process.env.MAX_TRANSACTION_AMOUNT || '100000');
exports.TRANSACTION_EXPIRES_MINUTES = parseInt(process.env.TRANSACTION_EXPIRES_MINUTES || '30', 10);
exports.GLOBAL_MIN_SETTLEMENT_AMOUNT = parseFloat(process.env.GLOBAL_MIN_SETTLEMENT_AMOUNT || '100');
exports.SETTLEMENT_FEE = parseFloat(process.env.SETTLEMENT_FEE || '10');
exports.default = {
    NODE_ENV: exports.NODE_ENV,
    PORT: exports.PORT,
    MAX_TRANSACTION_AMOUNT: exports.MAX_TRANSACTION_AMOUNT,
    TRANSACTION_EXPIRES_MINUTES: exports.TRANSACTION_EXPIRES_MINUTES,
    GLOBAL_MIN_SETTLEMENT_AMOUNT: exports.GLOBAL_MIN_SETTLEMENT_AMOUNT,
    SETTLEMENT_FEE: exports.SETTLEMENT_FEE,
};
