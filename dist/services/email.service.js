"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const email_config_1 = require("../config/email.config");
class EmailService {
    constructor() {
        this.templatesDir = path_1.default.join(__dirname, '../templates/emails');
        if (process.env.NODE_ENV === 'production' && email_config_1.emailConfig.auth.user) {
            this.transporter = nodemailer_1.default.createTransport(email_config_1.emailConfig);
        }
        else {
            console.log('📧 Email service in DEVELOPMENT mode (console logging)');
            this.transporter = null;
        }
    }
    async send(to, subject, html) {
        if (this.transporter) {
            await this.transporter.sendMail({
                from: `"${email_config_1.emailConfig.from.name}" <${email_config_1.emailConfig.from.address}>`,
                to,
                subject,
                html,
            });
            console.log(`📧 Email sent: ${subject} → ${to}`);
        }
        else {
            console.log('\n📧 EMAIL (Development Mode)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('To:', to);
            console.log('Subject:', subject);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(html);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }
    }
    renderTemplate(templateName, variables) {
        const basePath = path_1.default.join(this.templatesDir, 'base.html');
        const contentPath = path_1.default.join(this.templatesDir, `${templateName}.html`);
        let base = fs_1.default.readFileSync(basePath, 'utf8');
        let content = fs_1.default.readFileSync(contentPath, 'utf8');
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, String(value));
        }
        return base.replace('{{CONTENT}}', content);
    }
    async sendPartnerInvitation(params) {
        const html = this.renderTemplate('partner-invite', {
            businessName: params.businessName,
            inviteLink: params.inviteLink,
            expiresAt: params.expiresAt.toLocaleDateString(),
        });
        await this.send(params.email, 'Welcome to Paycher - Complete Your Registration', html);
    }
    async sendKYCApproved(params) {
        const html = this.renderTemplate('kyc-approved', {
            businessName: params.businessName,
            apiKey: params.apiKey,
            apiSecret: params.apiSecret,
            dashboardLink: `${process.env.APP_URL}/dashboard`,
        });
        await this.send(params.email, '✅ KYC Approved - Your Account is Active!', html);
    }
    async sendKYCRejected(params) {
        const html = this.renderTemplate('kyc-rejected', {
            businessName: params.businessName,
            rejectionReason: params.rejectionReason,
            dashboardLink: `${process.env.APP_URL}/dashboard`,
        });
        await this.send(params.email, 'KYC Review - Action Required', html);
    }
    async sendSettlementCompleted(params) {
        const html = this.renderTemplate('settlement-completed', {
            businessName: params.businessName,
            amount: params.amount.toFixed(2),
            fee: params.fee.toFixed(2),
            netAmount: params.netAmount.toFixed(2),
            bankReferenceId: params.bankReferenceId,
            completedAt: params.completedAt.toLocaleString(),
        });
        await this.send(params.email, 'Settlement Completed Successfully', html);
    }
    async sendApiKeyRotated(params) {
        const html = this.renderTemplate('api-key-rotated', {
            businessName: params.businessName,
            apiKey: params.apiKey,
            apiSecret: params.apiSecret,
        });
        await this.send(params.email, '🔒 Security Alert: API Key Rotated', html);
    }
    async sendCriticalAlert(params) {
        const html = this.renderTemplate('critical-alert', {
            alertType: params.alertType,
            description: params.description,
            details: JSON.stringify(params.details, null, 2),
            timestamp: new Date().toISOString(),
            dashboardLink: `${process.env.APP_URL}/admin/dashboard`,
        });
        await this.send(email_config_1.adminEmail, `🚨 Critical Alert: ${params.alertType}`, html);
    }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
