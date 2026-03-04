"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDateRange = validateDateRange;
const errors_1 = require("./errors");
function validateDateRange(from, to, defaultDays = 30) {
    const now = new Date();
    const toDate = to ? new Date(to) : now;
    const fromDate = from ? new Date(from) : new Date(now.getTime() - defaultDays * 24 * 60 * 60 * 1000);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()))
        throw new errors_1.BadRequestError('Invalid date');
    if (fromDate > toDate)
        throw new errors_1.BadRequestError('fromDate must be before toDate');
    const rangeDays = (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000);
    if (rangeDays > 365)
        throw new errors_1.BadRequestError('Date range too large');
    return { fromDate, toDate };
}
