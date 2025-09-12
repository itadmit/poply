const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const linkTrackingService = require('./linkTrackingService');

// SMS4FREE Configuration
const SMS4FREE_API = {
  SEND_URL: 'https://api.sms4free.co.il/ApiSMS/v2/SendSMS',
  BALANCE_URL: 'https://api.sms4free.co.il/ApiSMS/AvailableSMS',
  API_KEY: process.env.SMS4FREE_API_KEY || '6Gc8AXX5R',
  USER: process.env.SMS4FREE_USER || '',
  PASS: process.env.SMS4FREE_PASS || ''
};

// סטטוסים מ-SMS4FREE
const SMS_STATUS_MAP = {
  1: 'DELIVERED',   // הגיע ליעד
  5: 'FAILED',      // לא הגיע ליעד
  6: 'VALID_NUMBER' // מספר כשר
};

// מיפוי שגיאות
const ERROR_MESSAGES = {
  '-1': 'מפתח, שם משתמש או סיסמה שגויים',
  '-2': 'שם או מספר שולח ההודעה שגוי',
  '-3': 'לא נמצאו נמענים',
  '-4': 'לא ניתן לשלוח הודעה, יתרת הודעות פנויות נמוכה',
  '-5': 'הודעה לא מתאימה',
  '-6': 'צריך לאמת מספר שולח',
  '0': 'שגיאה כללית'
};

class SmsService {
  // שליחת SMS בודד
  async sendSms(userId, recipient, content, sender = null, campaignId = null, contactId = null) {
    try {
      // בדיקת יתרת SMS של המשתמש
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('משתמש לא נמצא');
      }

      if (user.smsBalance <= 0) {
        throw new Error('אין יתרת SMS זמינה');
      }

      // קביעת שם השולח
      const senderName = sender || user.smsSenderName || 'Poply';

      // יצירת רשומת SMS
      const smsMessage = await prisma.smsMessage.create({
        data: {
          userId,
          recipient,
          content,
          sender: senderName,
          campaignId,
          contactId,
          status: 'PENDING'
        }
      });

      // עיבוד קישורים בהודעה
      let processedContent = content;
      if (content.includes('http://') || content.includes('https://')) {
        const result = await linkTrackingService.processMessageContent(
          userId,
          content,
          smsMessage.id,
          contactId
        );
        processedContent = result.processedContent;
      }

      // שליחה ל-SMS4FREE
      const response = await this.sendToSms4Free([recipient], processedContent, senderName);

      if (response.status > 0) {
        // עדכון יתרת SMS
        await prisma.user.update({
          where: { id: userId },
          data: { smsBalance: { decrement: 1 } }
        });

        // עדכון סטטוס ההודעה
        await prisma.smsMessage.update({
          where: { id: smsMessage.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            apiResponse: response
          }
        });

        return { success: true, messageId: smsMessage.id, response };
      } else {
        // שליחה נכשלה
        await prisma.smsMessage.update({
          where: { id: smsMessage.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            apiResponse: response
          }
        });

        throw new Error(ERROR_MESSAGES[response.status.toString()] || response.message);
      }
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  // שליחת SMS מרובה (לקמפיין)
  async sendBulkSms(userId, recipients, content, sender = null, campaignId = null) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('משתמש לא נמצא');
      }

      if (user.smsBalance < recipients.length) {
        throw new Error(`אין מספיק יתרת SMS. נדרש: ${recipients.length}, זמין: ${user.smsBalance}`);
      }

      const senderName = sender || user.smsSenderName || 'Poply';

      // בדיקה אם יש קישורים בהודעה
      const hasLinks = content.includes('http://') || content.includes('https://');
      
      if (hasLinks) {
        // אם יש קישורים, שולחים לכל נמען בנפרד עם קישור ייחודי
        const results = [];
        let successCount = 0;
        
        for (const recipient of recipients) {
          try {
            // יצירת רשומת SMS
            const smsMessage = await prisma.smsMessage.create({
              data: {
                userId,
                recipient: recipient.phone,
                content,
                sender: senderName,
                campaignId,
                contactId: recipient.contactId || null,
                status: 'PENDING'
              }
            });
            
            // עיבוד קישורים עם טוקן ייחודי
            const result = await linkTrackingService.processMessageContent(
              userId,
              content,
              smsMessage.id,
              recipient.contactId
            );
            
            // שליחה ל-SMS4FREE
            const response = await this.sendToSms4Free(
              [recipient.phone],
              result.processedContent,
              senderName
            );
            
            if (response.status > 0) {
              await prisma.smsMessage.update({
                where: { id: smsMessage.id },
                data: {
                  status: 'SENT',
                  sentAt: new Date(),
                  apiResponse: response
                }
              });
              successCount++;
            } else {
              await prisma.smsMessage.update({
                where: { id: smsMessage.id },
                data: {
                  status: 'FAILED',
                  failedAt: new Date(),
                  apiResponse: response
                }
              });
            }
            
            results.push({ smsMessageId: smsMessage.id, success: response.status > 0 });
          } catch (err) {
            console.error(`Error sending SMS to ${recipient.phone}:`, err);
          }
        }
        
        // עדכון יתרת SMS
        if (successCount > 0) {
          await prisma.user.update({
            where: { id: userId },
            data: { smsBalance: { decrement: successCount } }
          });
        }
        
        return {
          success: true,
          sent: successCount,
          total: recipients.length,
          results
        };
      } else {
        // אם אין קישורים, שולחים לכולם ביחד
        const smsMessages = await Promise.all(
          recipients.map(recipient =>
            prisma.smsMessage.create({
              data: {
                userId,
                recipient: recipient.phone,
                content,
                sender: senderName,
                campaignId,
                contactId: recipient.contactId || null,
                status: 'PENDING'
              }
            })
          )
        );

        const phoneNumbers = recipients.map(r => r.phone);
        const response = await this.sendToSms4Free(phoneNumbers, content, senderName);

        if (response.status > 0) {
        // עדכון יתרת SMS
        await prisma.user.update({
          where: { id: userId },
          data: { smsBalance: { decrement: response.status } }
        });

        // עדכון סטטוס ההודעות
        await Promise.all(
          smsMessages.map(msg =>
            prisma.smsMessage.update({
              where: { id: msg.id },
              data: {
                status: 'SENT',
                sentAt: new Date(),
                apiResponse: response
              }
            })
          )
        );

        return { 
          success: true, 
          sent: response.status, 
          messageIds: smsMessages.map(m => m.id),
          response 
        };
      } else {
        // שליחה נכשלה
        await Promise.all(
          smsMessages.map(msg =>
            prisma.smsMessage.update({
              where: { id: msg.id },
              data: {
                status: 'FAILED',
                failedAt: new Date(),
                apiResponse: response
              }
            })
          )
        );

        throw new Error(ERROR_MESSAGES[response.status.toString()] || response.message);
        }
      }
    } catch (error) {
      console.error('Error sending bulk SMS:', error);
      throw error;
    }
  }

  // שליחה ל-API של SMS4FREE
  async sendToSms4Free(recipients, content, sender) {
    try {
      const recipientString = recipients.join(';');

      const response = await axios.post(
        SMS4FREE_API.SEND_URL,
        {
          key: SMS4FREE_API.API_KEY,
          user: SMS4FREE_API.USER,
          pass: SMS4FREE_API.PASS,
          sender,
          recipient: recipientString,
          msg: content
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('SMS4FREE API Error:', error.response?.data || error.message);
      throw new Error('שגיאה בשליחת SMS');
    }
  }

  // בדיקת יתרת SMS ב-SMS4FREE
  async checkSms4FreeBalance() {
    try {
      const response = await axios.post(
        SMS4FREE_API.BALANCE_URL,
        {
          key: SMS4FREE_API.API_KEY,
          user: SMS4FREE_API.USER,
          pass: SMS4FREE_API.PASS
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('SMS4FREE Balance Check Error:', error);
      throw new Error('שגיאה בבדיקת יתרה');
    }
  }

  // עדכון סטטוס SMS מ-webhook
  async updateSmsStatus(to, status) {
    try {
      const mappedStatus = SMS_STATUS_MAP[status] || 'FAILED';

      // מציאת ההודעה האחרונה שנשלחה למספר זה
      const smsMessage = await prisma.smsMessage.findFirst({
        where: {
          recipient: to,
          status: 'SENT'
        },
        orderBy: {
          sentAt: 'desc'
        }
      });

      if (smsMessage) {
        await prisma.smsMessage.update({
          where: { id: smsMessage.id },
          data: {
            status: mappedStatus,
            deliveredAt: mappedStatus === 'DELIVERED' ? new Date() : null,
            failedAt: mappedStatus === 'FAILED' ? new Date() : null
          }
        });
      }

      return { success: true, status: mappedStatus };
    } catch (error) {
      console.error('Error updating SMS status:', error);
      throw error;
    }
  }

  // הוספת חבילת SMS למשתמש
  async addSmsPackage(userId, packageData) {
    try {
      const smsPackage = await prisma.smsPackage.create({
        data: {
          userId,
          ...packageData
        }
      });

      // עדכון יתרת SMS של המשתמש
      await prisma.user.update({
        where: { id: userId },
        data: {
          smsBalance: { increment: packageData.amount }
        }
      });

      return smsPackage;
    } catch (error) {
      console.error('Error adding SMS package:', error);
      throw error;
    }
  }

  // קבלת היסטוריית SMS של משתמש
  async getUserSmsHistory(userId, filters = {}) {
    try {
      const where = { userId };

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.campaignId) {
        where.campaignId = filters.campaignId;
      }

      if (filters.from) {
        where.createdAt = { gte: new Date(filters.from) };
      }

      if (filters.to) {
        where.createdAt = { ...where.createdAt, lte: new Date(filters.to) };
      }

      const messages = await prisma.smsMessage.findMany({
        where,
        include: {
          campaign: true,
          contact: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return messages;
    } catch (error) {
      console.error('Error getting SMS history:', error);
      throw error;
    }
  }

  // קבלת סטטיסטיקות SMS
  async getSmsStats(userId) {
    try {
      const [sent, delivered, failed, balance, packages] = await Promise.all([
        prisma.smsMessage.count({
          where: { userId, status: 'SENT' }
        }),
        prisma.smsMessage.count({
          where: { userId, status: 'DELIVERED' }
        }),
        prisma.smsMessage.count({
          where: { userId, status: 'FAILED' }
        }),
        prisma.user.findUnique({
          where: { id: userId },
          select: { smsBalance: true }
        }),
        prisma.smsPackage.findMany({
          where: { userId },
          orderBy: { purchasedAt: 'desc' }
        })
      ]);

      const totalPurchased = packages.reduce((sum, pkg) => sum + pkg.amount, 0);

      return {
        sent,
        delivered,
        failed,
        balance: balance?.smsBalance || 0,
        totalPurchased,
        packages
      };
    } catch (error) {
      console.error('Error getting SMS stats:', error);
      throw error;
    }
  }

  // יצירת API key למשתמש
  async createApiKey(userId, name) {
    try {
      const apiKey = await prisma.smsApiKey.create({
        data: {
          userId,
          name
        }
      });

      return apiKey;
    } catch (error) {
      console.error('Error creating API key:', error);
      throw error;
    }
  }

  // בדיקת API key
  async validateApiKey(key) {
    try {
      const apiKey = await prisma.smsApiKey.findUnique({
        where: { key, isActive: true },
        include: { user: true }
      });

      return apiKey;
    } catch (error) {
      console.error('Error validating API key:', error);
      return null;
    }
  }
}

module.exports = new SmsService();
