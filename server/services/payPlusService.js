const axios = require('axios');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class PayPlusService {
  constructor() {
    this.apiKey = process.env.PAYPLUS_API_KEY;
    this.secretKey = process.env.PAYPLUS_SECRET_KEY;
    this.paymentPageUid = process.env.PAYPLUS_PAYMENT_PAGE_UID;
    this.environment = process.env.PAYPLUS_ENV || 'development';
    
    // Set API URLs based on environment
    this.apiUrl = this.environment === 'production' 
      ? 'https://restapi.payplus.co.il/api/v1.0'
      : 'https://restapidev.payplus.co.il/api/v1.0';
  }

  // יצירת קישור תשלום
  async createPaymentLink(params) {
    try {
      const {
        amount,
        customerName,
        customerEmail,
        customerPhone,
        productName,
        orderId,
        successUrl,
        failureUrl,
        callbackUrl,
        moreInfo = {}
      } = params;

      const requestData = {
        payment_page_uid: this.paymentPageUid,
        charge_method: 1, // Charge (J4) - תשלום מיידי
        amount: amount,
        currency_code: 'ILS',
        sendEmailApproval: true,
        sendEmailFailure: false,
        customer: {
          customer_name: customerName,
          email: customerEmail,
          phone: customerPhone
        },
        items: [{
          name: productName,
          quantity: 1,
          price: amount
        }],
        refURL_success: successUrl,
        refURL_failure: failureUrl,
        refURL_callback: callbackUrl,
        send_failure_callback: true,
        language_code: 'he',
        more_info: orderId, // שמירת מזהה ההזמנה
        more_info_2: moreInfo.userId || '',
        more_info_3: moreInfo.packageId || '',
        more_info_4: moreInfo.smsAmount || '',
        create_hash: true
      };

      const response = await axios.post(
        `${this.apiUrl}/PaymentPages/generateLink`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey,
            'secret-key': this.secretKey
          }
        }
      );

      if (response.data.results.status === 'success') {
        return {
          success: true,
          paymentLink: response.data.data.payment_page_link,
          pageRequestUid: response.data.data.page_request_uid
        };
      } else {
        throw new Error(response.data.results.description || 'שגיאה ביצירת קישור תשלום');
      }
    } catch (error) {
      console.error('PayPlus createPaymentLink error:', error);
      throw new Error('שגיאה ביצירת קישור תשלום');
    }
  }

  // אימות חתימה מ-PayPlus
  validatePayPlusHash(body, hash, userAgent) {
    if (!body || !hash || userAgent !== 'PayPlus') {
      return false;
    }

    const message = JSON.stringify(body);
    const genHash = crypto
      .createHmac('sha256', this.secretKey)
      .update(message)
      .digest('base64');

    return genHash === hash;
  }

  // עיבוד callback מ-PayPlus
  async processCallback(body, headers) {
    try {
      console.log('PayPlus callback received - Full body:', JSON.stringify(body, null, 2));
      console.log('PayPlus callback headers:', headers);
      
      // אימות החתימה
      const isValid = this.validatePayPlusHash(
        body,
        headers['hash'],
        headers['user-agent']
      );

      if (!isValid) {
        console.error('Invalid PayPlus signature');
        return { success: false, error: 'Invalid signature' };
      }

      // חילוץ נתונים מה-callback
      const transaction = body.transaction || body.data?.transaction;
      const more_info = body.more_info || body.data?.more_info;
      const more_info_2 = body.more_info_2 || body.data?.more_info_2;
      const more_info_3 = body.more_info_3 || body.data?.more_info_3;
      const more_info_4 = body.more_info_4 || body.data?.more_info_4;
      
      console.log('Extracted data:', {
        transaction,
        more_info,
        more_info_2,
        more_info_3,
        more_info_4
      });
      
      // בדיקת סטטוס התשלום
      if (!transaction || (transaction.status_code !== '000' && transaction.status_code !== 0)) {
        return {
          success: false,
          error: transaction?.status_description || 'Transaction failed',
          transactionId: transaction?.uid
        };
      }

      // תשלום הצליח - עדכון במערכת
      const orderId = more_info;
      const userId = more_info_2;
      const packageId = more_info_3;
      const smsAmount = parseInt(more_info_4 || '0');

      console.log('Processing payment update:', { orderId, userId, smsAmount });
      
      if (orderId && userId && smsAmount) {
        try {
          // בדיקה שהמשתמש קיים
          const user = await prisma.user.findUnique({
            where: { id: userId }
          });
          
          if (!user) {
            console.error('User not found:', userId);
            return {
              success: false,
              error: 'User not found'
            };
          }
          
          console.log('Found user:', user.email, 'Current balance:', user.smsBalance);
          
          // עדכון יתרת SMS
          const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
              smsBalance: {
                increment: smsAmount
              }
            }
          });
          
          console.log('Updated user balance:', updatedUser.smsBalance);

          // יצירת רשומת חבילה
          const smsPackage = await prisma.smsPackage.create({
            data: {
              userId,
              name: `חבילת ${smsAmount} הודעות SMS`,
              amount: smsAmount,
              price: parseFloat(transaction.amount || '0'),
              paymentTransactionId: transaction.uid
            }
          });
          
          console.log('Created SMS package:', smsPackage);
        } catch (dbError) {
          console.error('Database error:', dbError);
          return {
            success: false,
            error: 'Failed to update database'
          };
        }
      } else {
        console.error('Missing required data:', { orderId, userId, smsAmount });
      }

      return {
        success: true,
        transactionId: transaction.uid,
        amount: transaction.amount,
        orderId
      };
    } catch (error) {
      console.error('PayPlus processCallback error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // קבלת פרטי עסקה
  async getTransactionDetails(transactionUid) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/Transactions/view`,
        {
          transaction_uid: transactionUid
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey,
            'secret-key': this.secretKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('PayPlus getTransactionDetails error:', error);
      throw new Error('שגיאה בקבלת פרטי עסקה');
    }
  }

  // החזר כספי
  async refundTransaction(transactionUid, amount = null) {
    try {
      const requestData = {
        transaction_uid: transactionUid
      };

      if (amount) {
        requestData.amount = amount;
      }

      const response = await axios.post(
        `${this.apiUrl}/Transactions/refundByTransactionUID`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
            'api-key': this.apiKey,
            'secret-key': this.secretKey
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('PayPlus refundTransaction error:', error);
      throw new Error('שגיאה בביצוע החזר');
    }
  }
}

// יצירת instance יחיד
const payPlusService = new PayPlusService();

module.exports = payPlusService;
