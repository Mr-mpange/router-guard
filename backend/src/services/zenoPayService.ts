import axios from 'axios';
import { logger } from '../utils/logger';

interface ZenoPayConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
  webhookUrl: string;
}

interface PaymentRequest {
  amount: number;
  currency: string;
  phoneNumber: string;
  paymentMethod: 'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY';
  reference: string;
  description: string;
  callbackUrl?: string;
}

interface PaymentResponse {
  success: boolean;
  transactionId: string;
  reference: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  message: string;
  paymentUrl?: string;
}

interface WebhookPayload {
  transactionId: string;
  reference: string;
  status: 'COMPLETED' | 'FAILED' | 'CANCELLED';
  amount: number;
  currency: string;
  phoneNumber: string;
  paymentMethod: string;
  timestamp: string;
  signature: string;
}

export class ZenoPayService {
  private config: ZenoPayConfig;

  constructor() {
    this.config = {
      apiKey: process.env.ZENOPAY_API_KEY || '',
      secretKey: process.env.ZENOPAY_SECRET_KEY || '',
      baseUrl: process.env.ZENOPAY_BASE_URL || 'https://api.zenopay.co.tz',
      webhookUrl: process.env.ZENOPAY_WEBHOOK_URL || 'http://localhost:3001/api/webhooks/zenopay'
    };

    if (!this.config.apiKey || !this.config.secretKey) {
      logger.warn('ZenoPay API credentials not configured. Payment processing will be mocked.');
    }
  }

  /**
   * Initiate a payment request
   */
  async initiatePayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Check if we're in production mode with real API keys
      const isProduction = this.config.apiKey && this.config.secretKey && 
                          this.config.apiKey !== 'your-zenopay-api-key-here' &&
                          this.config.secretKey !== 'your-zenopay-secret-key-here';

      if (!isProduction) {
        logger.info('ZenoPay running in mock mode - add real API keys for production');
        return this.mockPaymentResponse(paymentData);
      }

      // Real ZenoPay API call
      const payload = {
        amount: paymentData.amount,
        currency: paymentData.currency,
        phone_number: paymentData.phoneNumber,
        payment_method: this.mapPaymentMethod(paymentData.paymentMethod),
        reference: paymentData.reference,
        description: paymentData.description,
        callback_url: paymentData.callbackUrl || this.config.webhookUrl,
        return_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/success/${paymentData.reference}`
      };

      logger.info(`Initiating ZenoPay payment: ${paymentData.reference}`, {
        amount: payload.amount,
        currency: payload.currency,
        phone: payload.phone_number,
        method: payload.payment_method
      });

      const response = await axios.post(`${this.config.baseUrl}/api/v1/payments/initiate`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-Key': this.config.apiKey,
          'X-Secret-Key': this.config.secretKey
        },
        timeout: 30000
      });

      logger.info(`ZenoPay response received:`, {
        status: response.status,
        data: response.data
      });

      const responseData = response.data;

      return {
        success: responseData.success !== false,
        transactionId: responseData.transaction_id || responseData.transactionId || responseData.id,
        reference: paymentData.reference,
        status: this.mapResponseStatus(responseData.status),
        message: responseData.message || 'Payment initiated successfully',
        paymentUrl: responseData.payment_url || responseData.paymentUrl || responseData.checkout_url
      };

    } catch (error) {
      logger.error('ZenoPay payment initiation failed:', error);
      
      if (axios.isAxiosError(error)) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.message || errorData?.error || error.message;
        
        logger.error('ZenoPay API Error:', {
          status: error.response?.status,
          data: errorData,
          headers: error.response?.headers
        });

        return {
          success: false,
          transactionId: '',
          reference: paymentData.reference,
          status: 'FAILED',
          message: `Payment failed: ${errorMessage}`
        };
      }

      return {
        success: false,
        transactionId: '',
        reference: paymentData.reference,
        status: 'FAILED',
        message: 'Payment service temporarily unavailable'
      };
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionId: string): Promise<PaymentResponse> {
    try {
      const isProduction = this.config.apiKey && this.config.secretKey && 
                          this.config.apiKey !== 'your-zenopay-api-key-here' &&
                          this.config.secretKey !== 'your-zenopay-secret-key-here';

      if (!isProduction) {
        // Mock response for development
        return {
          success: true,
          transactionId,
          reference: `REF-${transactionId}`,
          status: Math.random() > 0.3 ? 'COMPLETED' : 'PENDING',
          message: 'Payment status checked (mock mode)'
        };
      }

      const response = await axios.get(`${this.config.baseUrl}/api/v1/payments/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-Key': this.config.apiKey,
          'X-Secret-Key': this.config.secretKey
        },
        timeout: 15000
      });

      const responseData = response.data;

      return {
        success: true,
        transactionId,
        reference: responseData.reference || responseData.external_reference,
        status: this.mapResponseStatus(responseData.status),
        message: responseData.message || 'Payment status retrieved'
      };

    } catch (error) {
      logger.error('ZenoPay status check failed:', error);
      return {
        success: false,
        transactionId,
        reference: '',
        status: 'FAILED',
        message: 'Failed to check payment status'
      };
    }
  }

  /**
   * Map payment method to ZenoPay format
   */
  private mapPaymentMethod(method: 'MPESA' | 'TIGO_PESA' | 'AIRTEL_MONEY'): string {
    const methodMap = {
      'MPESA': 'mpesa',
      'TIGO_PESA': 'tigopesa',
      'AIRTEL_MONEY': 'airtelmoney'
    };
    return methodMap[method] || method.toLowerCase();
  }

  /**
   * Map ZenoPay response status to our internal status
   */
  private mapResponseStatus(status: string): 'PENDING' | 'COMPLETED' | 'FAILED' {
    if (!status) return 'PENDING';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('success') || statusLower.includes('complete') || statusLower === 'paid') {
      return 'COMPLETED';
    } else if (statusLower.includes('fail') || statusLower.includes('error') || statusLower.includes('cancel')) {
      return 'FAILED';
    } else {
      return 'PENDING';
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    try {
      if (!this.config.secretKey || this.config.secretKey === 'your-zenopay-secret-key-here') {
        logger.warn('Webhook signature verification skipped - no secret key configured');
        return true; // Allow in development mode
      }

      const crypto = require('crypto');
      
      // ZenoPay might use different signature formats, try common ones
      const signatures = [
        // Standard HMAC SHA256
        crypto.createHmac('sha256', this.config.secretKey).update(payload).digest('hex'),
        // With 'sha256=' prefix
        'sha256=' + crypto.createHmac('sha256', this.config.secretKey).update(payload).digest('hex'),
        // Base64 encoded
        crypto.createHmac('sha256', this.config.secretKey).update(payload).digest('base64')
      ];
      
      // Remove any prefixes from the provided signature
      const cleanSignature = signature.replace(/^(sha256=|sha1=)/, '');
      
      return signatures.some(sig => {
        const cleanSig = sig.replace(/^(sha256=|sha1=)/, '');
        return cleanSig === cleanSignature;
      });
      
    } catch (error) {
      logger.error('Webhook signature verification failed:', error);
      return false;
    }
  }

  /**
   * Process webhook payload
   */
  processWebhook(payload: WebhookPayload): boolean {
    try {
      // Validate required fields
      if (!payload.transactionId || !payload.reference || !payload.status) {
        logger.error('Invalid webhook payload: missing required fields');
        return false;
      }

      // Log webhook received
      logger.info(`ZenoPay webhook received: ${payload.transactionId} - ${payload.status}`);

      return true;
    } catch (error) {
      logger.error('Webhook processing failed:', error);
      return false;
    }
  }

  /**
   * Generate voucher code
   */
  generateVoucherCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `WIFI-${result}`;
  }

  /**
   * Mock payment response for development
   */
  private mockPaymentResponse(paymentData: PaymentRequest): PaymentResponse {
    const transactionId = `MOCK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info(`Mock payment initiated: ${paymentData.reference} - ${transactionId}`);
    
    return {
      success: true,
      transactionId,
      reference: paymentData.reference,
      status: 'PENDING',
      message: 'Mock payment initiated successfully (Development Mode)',
      paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/mock/${transactionId}`
    };
  }

  /**
   * Format phone number for ZenoPay
   */
  formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('0')) {
      cleaned = '255' + cleaned.substring(1);
    } else if (cleaned.startsWith('255')) {
      // Already in correct format
    } else if (cleaned.length === 9) {
      cleaned = '255' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Get supported payment methods
   */
  getSupportedPaymentMethods(): Array<{value: string, label: string, color: string}> {
    return [
      { value: 'MPESA', label: 'M-Pesa', color: 'bg-green-500' },
      { value: 'TIGO_PESA', label: 'Tigo Pesa', color: 'bg-blue-500' },
      { value: 'AIRTEL_MONEY', label: 'Airtel Money', color: 'bg-red-500' }
    ];
  }
}

export const zenoPayService = new ZenoPayService();