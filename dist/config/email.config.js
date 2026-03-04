"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminEmail = exports.emailConfig = void 0;
exports.emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
    from: {
        name: process.env.EMAIL_FROM_NAME || 'Paycher Platform',
        address: process.env.EMAIL_FROM_ADDRESS || 'noreply@paycher.com',
    },
};
exports.adminEmail = process.env.ADMIN_EMAIL || 'admin@paycher.com';
