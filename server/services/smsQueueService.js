const Bull = require('bull');
const Redis = require('redis');
const { PrismaClient } = require('@prisma/client');
const linkTrackingService = require('./linkTrackingService');
const unsubscribeService = require('./unsubscribeService');

const prisma = new PrismaClient();

// יצירת חיבור Redis (לא נחוץ כרגע - Bull יוצר חיבור משלו)
// const redis = Redis.createClient({
//   host: process.env.REDIS_HOST || 'localhost',
//   port: process.env.REDIS_PORT || 6379,
//   retryDelayOnFailure: 100,
//   maxRetriesPerRequest: 3
// });

// יצירת תור SMS
const smsQueue = new Bull('sms queue', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// הגדרות אצוות ועיכובים
const BATCH_CONFIG = {
  EMAIL: { size: 50, delay: 1000 },    // 50 אימיילים כל שנייה
  SMS: { size: 10, delay: 2000 },      // 10 SMS כל 2 שניות
  PUSH: { size: 100, delay: 500 }      // 100 push כל חצי שנייה
};

// SMS4FREE Configuration
const SMS4FREE_API = {
  SEND_URL: 'https://api.sms4free.co.il/ApiSMS/v2/SendSMS',
  BALANCE_URL: 'https://api.sms4free.co.il/ApiSMS/AvailableSMS',
  API_KEY: process.env.SMS4FREE_API_KEY || '6Gc8AXX5R',
  USERNAME: process.env.SMS4FREE_USERNAME || 'poply',
  PASSWORD: process.env.SMS4FREE_PASSWORD || 'Aa123456'
};

// קודי שגיאה של SMS4FREE
const ERROR_MESSAGES = {
  '-1': 'שגיאה כללית',
  '-2': 'משתמש או סיסמה שגויים',
  '-3': 'אין אשראי מספיק',
  '-4': 'מספר טלפון לא תקין',
  '-5': 'הודעה ריקה',
  '-6': 'שם שולח לא תקין',
  '-10': 'הודעה ארוכה מדי'
};

class SmsQueueService {
  
  constructor() {
    this.initializeQueue();
  }

  // אתחול התור
  initializeQueue() {
    // עיבוד משימות SMS
    smsQueue.process('send-sms', async (job) => {
      const { userId, phone, content, sender, campaignId, contactId, messageType = 'SMS' } = job.data;
      
      try {
        // בדיקת יתרת SMS של המשתמש
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user) {
          throw new Error('משתמש לא נמצא');
        }

        if (user.smsBalance < 1) {
          throw new Error('אין מספיק יתרת SMS');
        }

        // בדיקה אם איש הקשר הסיר את עצמו מקבלת SMS
        if (contactId) {
          const canSend = await unsubscribeService.canSendMessage(contactId, 'SMS');
          if (!canSend) {
            throw new Error('איש הקשר הסיר את עצמו מקבלת הודעות SMS');
          }
        }

        // קביעת שם השולח
        const senderName = sender || user.smsSenderName || 'Poply';

        // יצירת רשומת SMS במסד הנתונים
        const smsMessage = await prisma.smsMessage.create({
          data: {
            userId,
            recipient: phone,
            content,
            sender: senderName,
            campaignId,
            contactId,
            status: 'PENDING'
          }
        });

        // הוספת לינק הסרה מדיוור
        let processedContent = content;
        if (contactId) {
          processedContent = await unsubscribeService.addUnsubscribeLink(
            userId,
            contactId,
            content,
            'SMS'
          );
        }

        // עיבוד קישורים אם קיימים
        const hasLinks = processedContent.includes('http://') || processedContent.includes('https://');
        
        if (hasLinks && contactId) {
          const result = await linkTrackingService.processMessageContent(
            userId,
            processedContent,
            smsMessage.id,
            contactId
          );
          processedContent = result.processedContent;
        }

        // שליחה ל-SMS4FREE
        const response = await this.sendToSms4Free([phone], processedContent, senderName);
        
        if (response.status > 0) {
          // שליחה הצליחה
          await prisma.smsMessage.update({
            where: { id: smsMessage.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              apiResponse: response
            }
          });

          // עדכון יתרת SMS
          await prisma.user.update({
            where: { id: userId },
            data: { smsBalance: { decrement: 1 } }
          });

          // עדכון סטטוס CampaignContact אם זה קמפיין
          if (campaignId && contactId) {
            await prisma.campaignContact.updateMany({
              where: {
                campaignId,
                contactId,
                status: 'PENDING'
              },
              data: {
                status: 'SENT',
                sentAt: new Date()
              }
            });
          }

          return { success: true, smsMessageId: smsMessage.id };
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

          // עדכון סטטוס CampaignContact אם זה קמפיין
          if (campaignId && contactId) {
            await prisma.campaignContact.updateMany({
              where: {
                campaignId,
                contactId,
                status: 'PENDING'
              },
              data: {
                status: 'FAILED',
                failedAt: new Date()
              }
            });
          }

          const errorMessage = ERROR_MESSAGES[response.status.toString()] || response.message || 'שגיאה לא ידועה';
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('SMS send error:', error);
        throw error;
      }
    });

    // עיבוד אצוות SMS
    smsQueue.process('send-sms-batch', async (job) => {
      const { userId, recipients, content, sender, campaignId, messageType = 'SMS' } = job.data;
      
      const batchConfig = BATCH_CONFIG[messageType];
      const results = [];
      
      // חלוקה לאצוות
      for (let i = 0; i < recipients.length; i += batchConfig.size) {
        const batch = recipients.slice(i, i + batchConfig.size);
        
        // שליחת כל הודעה באצווה
        const batchPromises = batch.map(recipient => 
          this.addSmsToQueue(userId, recipient.phone, content, sender, campaignId, recipient.contactId, messageType)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
        
        // עיכוב בין אצוות (חוץ מהאצווה האחרונה)
        if (i + batchConfig.size < recipients.length) {
          await new Promise(resolve => setTimeout(resolve, batchConfig.delay));
        }
      }
      
      return {
        total: recipients.length,
        results: results.map(r => ({ success: r.status === 'fulfilled', error: r.reason?.message }))
      };
    });

    // מאזינים לאירועים
    smsQueue.on('completed', (job, result) => {
      console.log(`✅ SMS job ${job.id} completed successfully`);
    });

    smsQueue.on('failed', (job, err) => {
      console.error(`❌ SMS job ${job.id} failed:`, err.message);
    });

    smsQueue.on('stalled', (job) => {
      console.warn(`⏰ SMS job ${job.id} stalled`);
    });
  }

  // שליחת SMS יחיד (דרך התור)
  async sendSms(userId, phone, content, sender = null, campaignId = null, contactId = null, messageType = 'SMS') {
    const job = await smsQueue.add('send-sms', {
      userId,
      phone,
      content,
      sender,
      campaignId,
      contactId,
      messageType
    }, {
      priority: messageType === 'SMS' ? 1 : 2, // SMS רגיל בעדיפות גבוהה יותר מקמפיינים
      delay: 0
    });

    return { jobId: job.id, message: 'SMS נוסף לתור לשליחה' };
  }

  // שליחת SMS מרובה (דרך התור עם אצוות)
  async sendBulkSms(userId, recipients, content, sender = null, campaignId = null, messageType = 'SMS') {
    const job = await smsQueue.add('send-sms-batch', {
      userId,
      recipients,
      content,
      sender,
      campaignId,
      messageType
    }, {
      priority: messageType === 'SMS' ? 1 : 2,
      delay: 0
    });

    return { jobId: job.id, message: `${recipients.length} הודעות SMS נוספו לתור לשליחה` };
  }

  // הוספת SMS לתור (פונקציה פנימית)
  async addSmsToQueue(userId, phone, content, sender, campaignId, contactId, messageType) {
    return this.sendSms(userId, phone, content, sender, campaignId, contactId, messageType);
  }

  // שליחה ל-SMS4FREE (הפונקציה המקורית)
  async sendToSms4Free(phoneNumbers, message, sender = 'Poply') {
    try {
      const response = await fetch('https://api.sms4free.co.il/ApiSMS/v2/SendSMS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: process.env.SMS4FREE_API_KEY,
          user: process.env.SMS4FREE_USERNAME,
          pass: process.env.SMS4FREE_PASSWORD,
          sender: sender,
          recipient: phoneNumbers,
          msg: message
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('SMS4FREE API Error:', error);
      return { status: -1, message: error.message };
    }
  }

  // קבלת סטטיסטיקות התור
  async getQueueStats() {
    const waiting = await smsQueue.getWaiting();
    const active = await smsQueue.getActive();
    const completed = await smsQueue.getCompleted();
    const failed = await smsQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  }

  // ניקוי התור
  async cleanQueue() {
    await smsQueue.clean(24 * 60 * 60 * 1000, 'completed'); // מחיקת משימות שהושלמו לפני 24 שעות
    await smsQueue.clean(24 * 60 * 60 * 1000, 'failed');    // מחיקת משימות שנכשלו לפני 24 שעות
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

  // הוספת חבילת SMS
  async addSmsPackage(userId, packageData) {
    try {
      const smsPackage = await prisma.smsPackage.create({
        data: {
          userId,
          ...packageData
        }
      });

      // עדכון יתרת המשתמש
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

  // עדכון סטטוס SMS (webhook)
  async updateSmsStatus(recipient, status) {
    try {
      const statusMap = {
        1: 'DELIVERED',
        0: 'FAILED',
        2: 'PENDING'
      };

      const smsStatus = statusMap[status] || 'FAILED';

      await prisma.smsMessage.updateMany({
        where: {
          recipient,
          status: 'SENT'
        },
        data: {
          status: smsStatus,
          deliveredAt: smsStatus === 'DELIVERED' ? new Date() : null,
          failedAt: smsStatus === 'FAILED' ? new Date() : null
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating SMS status:', error);
      throw error;
    }
  }

  // בדיקת יתרה ב-SMS4FREE
  async checkSms4FreeBalance() {
    try {
      const response = await fetch(SMS4FREE_API.BALANCE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: process.env.SMS4FREE_API_KEY,
          user: process.env.SMS4FREE_USERNAME,
          pass: process.env.SMS4FREE_PASSWORD
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('SMS4FREE Balance API Error:', error);
      return { status: -1, message: error.message };
    }
  }

  // עצירת התור
  async close() {
    await smsQueue.close();
    // await redis.quit();
  }
}

// יצירת מופע יחיד
const smsQueueService = new SmsQueueService();

module.exports = smsQueueService; 