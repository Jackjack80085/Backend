import nodemailer from 'nodemailer'
import fs from 'fs'
import path from 'path'
import { emailConfig, adminEmail } from '../config/email.config'

export class EmailService {
  private transporter: nodemailer.Transporter | null
  private templatesDir: string

  constructor() {
    this.templatesDir = path.join(__dirname, '../templates/emails')

    if (process.env.NODE_ENV === 'production' && emailConfig.auth.user) {
      this.transporter = nodemailer.createTransport(emailConfig as any)
    } else {
      console.log('📧 Email service in DEVELOPMENT mode (console logging)')
      this.transporter = null
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (this.transporter) {
      await this.transporter.sendMail({
        from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
        to,
        subject,
        html,
      })
      console.log(`📧 Email sent: ${subject} → ${to}`)
    } else {
      console.log('\n📧 EMAIL (Development Mode)')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('To:', to)
      console.log('Subject:', subject)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(html)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    }
  }

  private renderTemplate(templateName: string, variables: Record<string, any>): string {
    const basePath = path.join(this.templatesDir, 'base.html')
    const contentPath = path.join(this.templatesDir, `${templateName}.html`)

    let base = fs.readFileSync(basePath, 'utf8')
    let content = fs.readFileSync(contentPath, 'utf8')

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, String(value))
    }

    return base.replace('{{CONTENT}}', content)
  }

  async sendPartnerInvitation(params: { email: string; businessName: string; inviteLink: string; expiresAt: Date }) {
    const html = this.renderTemplate('partner-invite', {
      businessName: params.businessName,
      inviteLink: params.inviteLink,
      expiresAt: params.expiresAt.toLocaleDateString(),
    })

    await this.send(params.email, 'Welcome to Paycher - Complete Your Registration', html)
  }

  async sendKYCApproved(params: { email: string; businessName: string; apiKey: string; apiSecret: string }) {
    const html = this.renderTemplate('kyc-approved', {
      businessName: params.businessName,
      apiKey: params.apiKey,
      apiSecret: params.apiSecret,
      dashboardLink: `${process.env.APP_URL}/dashboard`,
    })

    await this.send(params.email, '✅ KYC Approved - Your Account is Active!', html)
  }

  async sendKYCRejected(params: { email: string; businessName: string; rejectionReason: string }) {
    const html = this.renderTemplate('kyc-rejected', {
      businessName: params.businessName,
      rejectionReason: params.rejectionReason,
      dashboardLink: `${process.env.APP_URL}/dashboard`,
    })

    await this.send(params.email, 'KYC Review - Action Required', html)
  }

  async sendSettlementCompleted(params: { email: string; businessName: string; amount: number; fee: number; netAmount: number; bankReferenceId: string; completedAt: Date }) {
    const html = this.renderTemplate('settlement-completed', {
      businessName: params.businessName,
      amount: params.amount.toFixed(2),
      fee: params.fee.toFixed(2),
      netAmount: params.netAmount.toFixed(2),
      bankReferenceId: params.bankReferenceId,
      completedAt: params.completedAt.toLocaleString(),
    })

    await this.send(params.email, 'Settlement Completed Successfully', html)
  }

  async sendApiKeyRotated(params: { email: string; businessName: string; apiKey: string; apiSecret: string }) {
    const html = this.renderTemplate('api-key-rotated', {
      businessName: params.businessName,
      apiKey: params.apiKey,
      apiSecret: params.apiSecret,
    })

    await this.send(params.email, '🔒 Security Alert: API Key Rotated', html)
  }

  async sendCriticalAlert(params: { alertType: string; description: string; details: any }) {
    const html = this.renderTemplate('critical-alert', {
      alertType: params.alertType,
      description: params.description,
      details: JSON.stringify(params.details, null, 2),
      timestamp: new Date().toISOString(),
      dashboardLink: `${process.env.APP_URL}/admin/dashboard`,
    })

    await this.send(adminEmail, `🚨 Critical Alert: ${params.alertType}`, html)
  }
}

export const emailService = new EmailService()
