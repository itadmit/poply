const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

class LinkTrackingService {
  // יצירת קוד קצר ייחודי
  generateShortCode(length = 6) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // יצירת טוקן ייחודי לנמען
  generateRecipientToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  // יצירת או קבלת קישור מקוצר
  async createShortLink(userId, originalUrl, expiresInDays = null) {
    try {
      // בדיקה אם קיים כבר קישור מקוצר לכתובת זו
      const existingLink = await prisma.shortLink.findFirst({
        where: {
          userId,
          originalUrl,
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      });

      if (existingLink) {
        return existingLink;
      }

      // יצירת קוד קצר ייחודי
      let shortCode;
      let attempts = 0;
      do {
        shortCode = this.generateShortCode();
        const exists = await prisma.shortLink.findUnique({
          where: { shortCode }
        });
        if (!exists) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        throw new Error('לא ניתן ליצור קוד קצר ייחודי');
      }

      // חישוב תאריך תפוגה
      let expiresAt = null;
      if (expiresInDays) {
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      }

      // יצירת הקישור המקוצר
      const shortLink = await prisma.shortLink.create({
        data: {
          userId,
          shortCode,
          originalUrl,
          expiresAt
        }
      });

      return shortLink;
    } catch (error) {
      console.error('Error creating short link:', error);
      throw error;
    }
  }

  // יצירת קישור ייחודי לנמען SMS
  async createSmsLink(smsMessageId, shortLinkId, contactId = null) {
    try {
      const token = this.generateRecipientToken();

      const smsLink = await prisma.smsLink.create({
        data: {
          token,
          smsMessageId,
          shortLinkId,
          contactId
        }
      });

      return smsLink;
    } catch (error) {
      console.error('Error creating SMS link:', error);
      throw error;
    }
  }

  // עיבוד תוכן SMS והחלפת קישורים
  async processMessageContent(userId, content, smsMessageId, contactId = null) {
    try {
      // חיפוש כל הקישורים בהודעה
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = content.match(urlRegex) || [];
      
      let processedContent = content;
      const linkMappings = [];

      for (const url of urls) {
        // יצירת קישור מקוצר
        const shortLink = await this.createShortLink(userId, url);
        
        // יצירת קישור ייחודי לנמען
        const smsLink = await this.createSmsLink(smsMessageId, shortLink.id, contactId);
        
        // בניית הקישור המקוצר המלא
        const baseUrl = process.env.SHORT_LINK_DOMAIN || `${process.env.CLIENT_URL}/l`;
        const shortUrl = `${baseUrl}/${smsLink.token}`;
        
        // החלפת הקישור המקורי בקישור המקוצר
        processedContent = processedContent.replace(url, shortUrl);
        
        linkMappings.push({
          originalUrl: url,
          shortUrl,
          token: smsLink.token
        });
      }

      return {
        processedContent,
        linkMappings
      };
    } catch (error) {
      console.error('Error processing message content:', error);
      throw error;
    }
  }

  // רישום קליק על קישור
  async recordClick(token, ipAddress = null, userAgent = null, referer = null) {
    try {
      // מציאת הקישור לפי הטוקן
      const smsLink = await prisma.smsLink.findUnique({
        where: { token },
        include: {
          shortLink: true,
          contact: true
        }
      });

      if (!smsLink) {
        throw new Error('קישור לא נמצא');
      }

      // בדיקת תוקף הקישור
      if (smsLink.shortLink.expiresAt && smsLink.shortLink.expiresAt < new Date()) {
        throw new Error('הקישור פג תוקף');
      }

      // יצירת או קבלת session ID
      let sessionId = null;
      if (smsLink.contactId) {
        sessionId = await this.getOrCreateSession(smsLink.contactId);
      }

      // רישום הקליק
      const click = await prisma.linkClick.create({
        data: {
          shortLinkId: smsLink.shortLinkId,
          smsLinkId: smsLink.id,
          contactId: smsLink.contactId,
          ipAddress,
          userAgent,
          referer,
          sessionId
        }
      });

      // עדכון אירוע לאוטומציה
      if (smsLink.contactId) {
        await this.createAutomationEvent(smsLink.contactId, 'SMS_LINK_CLICKED', {
          smsLinkId: smsLink.id,
          shortLinkId: smsLink.shortLinkId,
          originalUrl: smsLink.shortLink.originalUrl
        });
      }

      return {
        click,
        originalUrl: smsLink.shortLink.originalUrl,
        contactId: smsLink.contactId,
        sessionId
      };
    } catch (error) {
      console.error('Error recording click:', error);
      throw error;
    }
  }

  // יצירת או קבלת session
  async getOrCreateSession(contactId) {
    try {
      // בדיקה אם יש session פעיל (נגדיר פעיל כ-30 יום)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const existingSession = await prisma.contactSession.findFirst({
        where: {
          contactId,
          lastSeenAt: { gte: thirtyDaysAgo }
        },
        orderBy: { lastSeenAt: 'desc' }
      });

      if (existingSession) {
        // עדכון זמן אחרון
        await prisma.contactSession.update({
          where: { id: existingSession.id },
          data: { lastSeenAt: new Date() }
        });
        return existingSession.sessionId;
      }

      // יצירת session חדש
      const sessionId = crypto.randomBytes(16).toString('hex');
      await prisma.contactSession.create({
        data: {
          sessionId,
          contactId
        }
      });

      return sessionId;
    } catch (error) {
      console.error('Error managing session:', error);
      throw error;
    }
  }

  // רישום אירוע session
  async recordSessionEvent(sessionId, eventType, eventData, pageUrl = null) {
    try {
      const session = await prisma.contactSession.findUnique({
        where: { sessionId }
      });

      if (!session) {
        console.warn('Session not found:', sessionId);
        return null;
      }

      // עדכון זמן אחרון של ה-session
      await prisma.contactSession.update({
        where: { id: session.id },
        data: { lastSeenAt: new Date() }
      });

      // יצירת האירוע
      const event = await prisma.sessionEvent.create({
        data: {
          sessionId: session.id,
          eventType,
          eventData,
          pageUrl
        }
      });

      // יצירת אירוע לאוטומציה
      await this.createAutomationEvent(session.contactId, eventType, {
        ...eventData,
        pageUrl,
        sessionId
      });

      return event;
    } catch (error) {
      console.error('Error recording session event:', error);
      throw error;
    }
  }

  // יצירת אירוע לאוטומציה
  async createAutomationEvent(contactId, eventType, eventData) {
    try {
      // מציאת המשתמש של איש הקשר
      const contact = await prisma.contact.findUnique({
        where: { id: contactId },
        select: { userId: true }
      });

      if (!contact) return;

      await prisma.event.create({
        data: {
          userId: contact.userId,
          contactId,
          type: 'CUSTOM',
          data: {
            customType: eventType,
            ...eventData
          }
        }
      });
    } catch (error) {
      console.error('Error creating automation event:', error);
    }
  }

  // קבלת סטטיסטיקות קישור
  async getLinkStats(shortLinkId) {
    try {
      const [totalClicks, uniqueClicks, clicksByDay] = await Promise.all([
        // סה"כ קליקים
        prisma.linkClick.count({
          where: { shortLinkId }
        }),
        
        // קליקים ייחודיים (לפי איש קשר)
        prisma.linkClick.groupBy({
          by: ['contactId'],
          where: { 
            shortLinkId,
            contactId: { not: null }
          },
          _count: true
        }),
        
        // קליקים לפי יום
        prisma.$queryRaw`
          SELECT 
            DATE(clicked_at) as date,
            COUNT(*) as clicks
          FROM link_clicks
          WHERE short_link_id = ${shortLinkId}
          GROUP BY DATE(clicked_at)
          ORDER BY date DESC
          LIMIT 30
        `
      ]);

      return {
        totalClicks,
        uniqueClicks: uniqueClicks.length,
        clicksByDay
      };
    } catch (error) {
      console.error('Error getting link stats:', error);
      throw error;
    }
  }

  // קבלת סטטיסטיקות SMS
  async getSmsLinkStats(smsMessageId) {
    try {
      const smsLinks = await prisma.smsLink.findMany({
        where: { smsMessageId },
        include: {
          clicks: true,
          contact: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      const stats = smsLinks.map(link => ({
        contact: link.contact,
        token: link.token,
        clickCount: link.clicks.length,
        firstClick: link.clicks[0]?.clickedAt || null,
        lastClick: link.clicks[link.clicks.length - 1]?.clickedAt || null
      }));

      return {
        totalRecipients: smsLinks.length,
        totalClicks: smsLinks.reduce((sum, link) => sum + link.clicks.length, 0),
        clickedRecipients: smsLinks.filter(link => link.clicks.length > 0).length,
        clickRate: smsLinks.length > 0 
          ? (smsLinks.filter(link => link.clicks.length > 0).length / smsLinks.length) * 100 
          : 0,
        recipientStats: stats
      };
    } catch (error) {
      console.error('Error getting SMS link stats:', error);
      throw error;
    }
  }

  // ניקוי קישורים שפג תוקפם
  async cleanupExpiredLinks() {
    try {
      const result = await prisma.shortLink.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      console.log(`Cleaned up ${result.count} expired links`);
      return result.count;
    } catch (error) {
      console.error('Error cleaning up expired links:', error);
      throw error;
    }
  }
}

module.exports = new LinkTrackingService();
