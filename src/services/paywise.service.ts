import axios, { AxiosInstance } from 'axios';
import { paywiseConfig } from '../config/paywise.config';
import { encryptPaywiseData, decryptPaywiseData } from '../utils/paywiseEncryption';
import { AppError } from '../utils/AppError';

interface PaywiseToken {
  token: string;
  expiresAt: number; // Unix timestamp
}

// Note: this module exports the `PaywiseService` class; consumers should
// instantiate it (or create their own singleton) to avoid module init order issues.

export class PaywiseService {
  private axiosInstance: AxiosInstance;
  private currentToken: PaywiseToken | null = null;
  private tokenRefreshPromise: Promise<string> | null = null;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: paywiseConfig.baseUrl,
      timeout: paywiseConfig.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  private async getToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    if (
      this.currentToken &&
      this.currentToken.expiresAt > now + paywiseConfig.tokenRefreshBuffer
    ) {
      return this.currentToken.token;
    }
    if (this.tokenRefreshPromise) {
      return await this.tokenRefreshPromise;
    }
    this.tokenRefreshPromise = this.generateAccessToken();
    try {
      const token = await this.tokenRefreshPromise;
      return token;
    } finally {
      this.tokenRefreshPromise = null;
    }
  }

  private async generateAccessToken(): Promise<string> {
    try {
      const credentials = {
        apiKey: paywiseConfig.apiKey,
        secretKey: paywiseConfig.secretKey
      };
      const encryptedPayload = encryptPaywiseData(
        credentials,
        paywiseConfig.apiKey,
        paywiseConfig.secretKey
      );
      const response = await this.axiosInstance.post(
        '/v1/auth/clients/token',
        { payload: encryptedPayload }
      );
      if (response.data.respCode !== 2000) {
        throw new AppError(
          500,
          `Paywise token generation failed: ${response.data.message || 'Unknown error'}`,
          'PAYWISE_TOKEN_ERROR'
        );
      }
      const decryptedData = decryptPaywiseData(
        response.data.data,
        paywiseConfig.apiKey,
        paywiseConfig.secretKey
      );
      const tokenData = JSON.parse(decryptedData);
      const token = tokenData.token;
      const expiresAt = Math.floor(Date.now() / 1000) + paywiseConfig.tokenExpirySeconds;
      this.currentToken = { token, expiresAt };
      return token;
    } catch (error: any) {
      throw new AppError(
        500,
        'Failed to authenticate with Paywise',
        'PAYWISE_AUTH_ERROR',
        { originalError: error.message }
      );
    }
  }

  async initiateCollection(params: {
    transactionId: string;
    amount: number;
    userEmail?: string;
    userPhone?: string;
    callbackUrl?: string;
  }): Promise<{
    paywiseTransactionId: string;
    paymentUrl?: string;
    qrCode?: string;
    upiIntent?: string;
    status: string;
  }> {
    // Dev mock: skip real Paywise call
    if (process.env.MOCK_PAYWISE === 'true') {
      return {
        paywiseTransactionId: `mock_${params.transactionId}`,
        paymentUrl: `http://localhost:5000/mock-payment?txn=${params.transactionId}`,
        status: 'PENDING',
      };
    }
    try {
      const token = await this.getToken();
      const collectionData = {
        senderId: params.transactionId,
        requestAmount: params.amount.toFixed(2),
        vpa: paywiseConfig.merchantVPA,
        callbackUrl: params.callbackUrl || `${process.env.APP_URL}/webhooks/paywise`
      };
      const encryptedPayload = encryptPaywiseData(
        collectionData,
        paywiseConfig.apiKey,
        paywiseConfig.secretKey
      );
      const response = await this.axiosInstance.post(
        '/collection/v1/initiate',
        { payload: encryptedPayload },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data.respCode !== 2000) {
        throw new AppError(
          500,
          `Paywise collection failed: ${response.data.message || 'Unknown error'}`,
          'PAYWISE_COLLECTION_ERROR',
          { respCode: response.data.respCode }
        );
      }
      const decryptedData = decryptPaywiseData(
        response.data.data,
        paywiseConfig.apiKey,
        paywiseConfig.secretKey
      );
      const result = JSON.parse(decryptedData);
      return {
        paywiseTransactionId: result.transactionId || result.txnId || result.id,
        paymentUrl: result.paymentUrl || result.paymentLink,
        qrCode: result.qrCode,
        upiIntent: result.upiIntent,
        status: result.status || 'PENDING'
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        500,
        'Failed to initiate payment with Paywise',
        'PAYWISE_COLLECTION_ERROR',
        { originalError: error.message }
      );
    }
  }

  async checkCollectionStatus(params: {
    senderId: string;
  }): Promise<{
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    paywiseTransactionId?: string;
    amount?: number;
    paymentMethod?: string;
  }> {
    try {
      const token = await this.getToken();
      const statusData = {
        senderId: params.senderId
      };
      const encryptedPayload = encryptPaywiseData(
        statusData,
        paywiseConfig.apiKey,
        paywiseConfig.secretKey
      );
      const response = await this.axiosInstance.post(
        '/collection/v1/status',
        { payload: encryptedPayload },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      if (response.data.respCode !== 2000) {
        throw new AppError(
          500,
          'Paywise status check failed',
          'PAYWISE_STATUS_ERROR'
        );
      }
      const decryptedData = decryptPaywiseData(
        response.data.data,
        paywiseConfig.apiKey,
        paywiseConfig.secretKey
      );
      const result = JSON.parse(decryptedData);
      return {
        status: this.normalizeStatus(result.status),
        paywiseTransactionId: result.transactionId || result.txnId,
        amount: result.amount ? parseFloat(result.amount) : undefined,
        paymentMethod: result.paymentMethod || result.paymentMode
      };
    } catch (error: any) {
      throw new AppError(
        500,
        'Failed to check payment status',
        'PAYWISE_STATUS_ERROR',
        { originalError: error.message }
      );
    }
  }

  verifyWebhookSignature(payload: any, signature: string): boolean {
    try {
      const crypto = require('crypto');
      const expectedSignature = crypto
        .createHmac('sha256', paywiseConfig.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      return false;
    }
  }

  decryptWebhookPayload(encryptedData: string): any {
    try {
      const decrypted = decryptPaywiseData(
        encryptedData,
        paywiseConfig.apiKey,
        paywiseConfig.secretKey
      );
      return JSON.parse(decrypted);
    } catch (error) {
      throw new AppError(
        400,
        'Invalid webhook payload',
        'INVALID_WEBHOOK'
      );
    }
  }

  private normalizeStatus(paywiseStatus: string): 'PENDING' | 'SUCCESS' | 'FAILED' {
    const status = paywiseStatus.toUpperCase();
    if (status === 'SUCCESS' || status === 'COMPLETED' || status === 'SETTLED') {
      return 'SUCCESS';
    }
    if (status === 'FAILED' || status === 'DECLINED' || status === 'REJECTED') {
      return 'FAILED';
    }
    return 'PENDING';
  }

}
