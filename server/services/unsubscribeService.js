const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const linkTrackingService = require('./linkTrackingService');

const prisma = new PrismaClient();

class UnsubscribeService {
  
  // יצירת טוקן הסרה ייחודי לאיש קשר
  generateUnsubscribeToken(contactId, userId) {
    const data = `${contactId}-${userId}-${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  // יצירת קישור הסרה מדיוור
  async createUnsubscribeLink(userId, contactId, messageType = 'BOTH') {
    try {
      // בדיקה אם כבר קיים טוקן פעיל לאיש הקשר
      const existingToken = await prisma.unsubscribeToken.findFirst({
        where: {
          contactId,
          userId,
          messageType,
          isActive: true
        }
      });

      if (existingToken) {
        const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
        return `${baseUrl}/unsubscribe/${existingToken.token}`;
      }

      // יצירת טוקן חדש
      const token = this.generateUnsubscribeToken(contactId, userId);
      
      await prisma.unsubscribeToken.create({
        data: {
          token,
          contactId,
          userId,
          messageType,
          isActive: true
        }
      });

      const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
      return `${baseUrl}/unsubscribe/${token}`;
    } catch (error) {
      console.error('Error creating unsubscribe link:', error);
      throw error;
    }
  }

  // הוספת לינק הסרה לתוכן הודעה
  async addUnsubscribeLink(userId, contactId, content, messageType = 'SMS') {
    try {
      const unsubscribeUrl = await this.createUnsubscribeLink(userId, contactId, messageType);
      
      // יצירת קישור מקוצר ללינק ההסרה
      const shortLink = await linkTrackingService.createShortLink(userId, unsubscribeUrl, 365); // תוקף שנה
      const baseUrl = process.env.SHORT_LINK_DOMAIN || `${process.env.CLIENT_URL}/l`;
      const shortUnsubscribeUrl = `${baseUrl}/${shortLink.shortCode}`;

      // הוספת הלינק לתוכן
      const unsubscribeText = messageType === 'EMAIL' 
        ? `\n\nלהסרה מרשימת הדיוור: ${shortUnsubscribeUrl}`
        : `\n\nהסרה: ${shortUnsubscribeUrl}`;
      
      return content + unsubscribeText;
    } catch (error) {
      console.error('Error adding unsubscribe link:', error);
      return content; // החזרת התוכן המקורי במקרה של שגיאה
    }
  }

  // בדיקת סטטוס הסרה של איש קשר
  async getUnsubscribeStatus(contactId, messageType = 'BOTH') {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: {
          emailUnsubscribed: true,
          smsUnsubscribed: true,
          unsubscribedAt: true
        }
      });

      if (!contact) {
        throw new Error('איש קשר לא נמצא');
      }

      switch (messageType) {
        case 'EMAIL':
          return contact.emailUnsubscribed;
        case 'SMS':
          return contact.smsUnsubscribed;
        case 'BOTH':
          return contact.emailUnsubscribed && contact.smsUnsubscribed;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking unsubscribe status:', error);
      throw error;
    }
  }

  // הסרת איש קשר מדיוור
  async unsubscribeContact(token, ipAddress = null, userAgent = null) {
    try {
      // מציאת הטוקן
      const unsubscribeToken = await prisma.unsubscribeToken.findUnique({
        where: { token },
        include: { contact: true, user: true }
      });

      if (!unsubscribeToken || !unsubscribeToken.isActive) {
        throw new Error('טוקן הסרה לא תקין או פג תוקף');
      }

      const { contactId, messageType } = unsubscribeToken;

      // עדכון סטטוס ההסרה של איש הקשר
      const updateData = { unsubscribedAt: new Date() };
      
      switch (messageType) {
        case 'EMAIL':
          updateData.emailUnsubscribed = true;
          break;
        case 'SMS':
          updateData.smsUnsubscribed = true;
          break;
        case 'BOTH':
          updateData.emailUnsubscribed = true;
          updateData.smsUnsubscribed = true;
          break;
      }

      await prisma.contact.update({
        where: { id: contactId },
        data: updateData
      });

      // רישום פעולת ההסרה
      await prisma.unsubscribeLog.create({
        data: {
          contactId,
          userId: unsubscribeToken.userId,
          messageType,
          ipAddress,
          userAgent,
          token
        }
      });

      // השבתת הטוקן
      await prisma.unsubscribeToken.update({
        where: { token },
        data: { isActive: false, usedAt: new Date() }
      });

      return {
        success: true,
        contact: unsubscribeToken.contact,
        messageType
      };
    } catch (error) {
      console.error('Error unsubscribing contact:', error);
      throw error;
    }
  }

  // הרשמה מחדש לדיוור
  async resubscribeContact(token, ipAddress = null, userAgent = null) {
    try {
      // מציאת הטוקן
      const unsubscribeToken = await prisma.unsubscribeToken.findUnique({
        where: { token },
        include: { contact: true, user: true }
      });

      if (!unsubscribeToken) {
        throw new Error('טוקן לא תקין');
      }

      const { contactId, messageType } = unsubscribeToken;

      // עדכון סטטוס ההרשמה של איש הקשר
      const updateData = {};
      
      switch (messageType) {
        case 'EMAIL':
          updateData.emailUnsubscribed = false;
          break;
        case 'SMS':
          updateData.smsUnsubscribed = false;
          break;
        case 'BOTH':
          updateData.emailUnsubscribed = false;
          updateData.smsUnsubscribed = false;
          break;
      }

      await prisma.contact.update({
        where: { id: contactId },
        data: updateData
      });

      // רישום פעולת ההרשמה מחדש
      await prisma.resubscribeLog.create({
        data: {
          contactId,
          userId: unsubscribeToken.userId,
          messageType,
          ipAddress,
          userAgent,
          token
        }
      });

      return {
        success: true,
        contact: unsubscribeToken.contact,
        messageType
      };
    } catch (error) {
      console.error('Error resubscribing contact:', error);
      throw error;
    }
  }

  // קבלת פרטי טוקן להצגה בממשק
  async getTokenDetails(token) {
    try {
      const unsubscribeToken = await prisma.unsubscribeToken.findUnique({
        where: { token },
        include: { 
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              emailUnsubscribed: true,
              smsUnsubscribed: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!unsubscribeToken) {
        throw new Error('טוקן לא תקין');
      }

      return unsubscribeToken;
    } catch (error) {
      console.error('Error getting token details:', error);
      throw error;
    }
  }

  // בדיקה אם איש קשר יכול לקבל הודעות
  async canSendMessage(contactId, messageType) {
    try {
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: {
          emailUnsubscribed: true,
          smsUnsubscribed: true
        }
      });

      if (!contact) {
        return false;
      }

      switch (messageType.toUpperCase()) {
        case 'EMAIL':
          return !contact.emailUnsubscribed;
        case 'SMS':
          return !contact.smsUnsubscribed;
        default:
          return true;
      }
    } catch (error) {
      console.error('Error checking send permission:', error);
      return false;
    }
  }
}

module.exports = new UnsubscribeService(); 