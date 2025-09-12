const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const linkTrackingService = require('../services/linkTrackingService');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// קבלת סטטיסטיקות קישור מקוצר
router.get('/link/:shortLinkId', authenticateToken, async (req, res) => {
  try {
    const { shortLinkId } = req.params;
    
    // בדיקה שהקישור שייך למשתמש
    const shortLink = await prisma.shortLink.findFirst({
      where: {
        id: shortLinkId,
        userId: req.user.id
      }
    });
    
    if (!shortLink) {
      return res.status(404).json({ error: 'קישור לא נמצא' });
    }
    
    const stats = await linkTrackingService.getLinkStats(shortLinkId);
    
    res.json({
      shortLink,
      stats
    });
  } catch (error) {
    console.error('Error getting link stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// קבלת סטטיסטיקות SMS
router.get('/sms/:smsMessageId', authenticateToken, async (req, res) => {
  try {
    const { smsMessageId } = req.params;
    
    // בדיקה שההודעה שייכת למשתמש
    const smsMessage = await prisma.smsMessage.findFirst({
      where: {
        id: smsMessageId,
        userId: req.user.id
      },
      include: {
        contact: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    });
    
    if (!smsMessage) {
      return res.status(404).json({ error: 'הודעה לא נמצאה' });
    }
    
    const stats = await linkTrackingService.getSmsLinkStats(smsMessageId);
    
    res.json({
      smsMessage,
      stats
    });
  } catch (error) {
    console.error('Error getting SMS stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// קבלת סטטיסטיקות קמפיין SMS
router.get('/campaign/:campaignId', authenticateToken, async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    // בדיקה שהקמפיין שייך למשתמש
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        userId: req.user.id,
        type: 'SMS'
      }
    });
    
    if (!campaign) {
      return res.status(404).json({ error: 'קמפיין לא נמצא' });
    }
    
    // קבלת כל ההודעות של הקמפיין
    const smsMessages = await prisma.smsMessage.findMany({
      where: {
        campaignId,
        userId: req.user.id
      }
    });
    
    // קבלת סטטיסטיקות לכל הודעה
    const allStats = await Promise.all(
      smsMessages.map(async (msg) => {
        const stats = await linkTrackingService.getSmsLinkStats(msg.id);
        return { messageId: msg.id, ...stats };
      })
    );
    
    // חישוב סטטיסטיקות כוללות
    const totalStats = {
      totalMessages: smsMessages.length,
      totalSent: smsMessages.filter(m => m.status === 'SENT').length,
      totalDelivered: smsMessages.filter(m => m.status === 'DELIVERED').length,
      totalFailed: smsMessages.filter(m => m.status === 'FAILED').length,
      totalClicks: allStats.reduce((sum, s) => sum + s.totalClicks, 0),
      uniqueClickers: new Set(allStats.flatMap(s => 
        s.recipientStats?.filter(r => r.clickCount > 0).map(r => r.contact?.id) || []
      )).size,
      averageClickRate: allStats.length > 0
        ? allStats.reduce((sum, s) => sum + (s.clickRate || 0), 0) / allStats.length
        : 0
    };
    
    res.json({
      campaign,
      totalStats,
      messageStats: allStats
    });
  } catch (error) {
    console.error('Error getting campaign stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// קבלת פעילות של איש קשר
router.get('/contact/:contactId', authenticateToken, async (req, res) => {
  try {
    const { contactId } = req.params;
    
    // בדיקה שאיש הקשר שייך למשתמש
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: req.user.id
      }
    });
    
    if (!contact) {
      return res.status(404).json({ error: 'איש קשר לא נמצא' });
    }
    
    // קבלת כל הקליקים של איש הקשר
    const clicks = await prisma.linkClick.findMany({
      where: { contactId },
      include: {
        shortLink: true,
        smsLink: {
          include: {
            smsMessage: true
          }
        }
      },
      orderBy: { clickedAt: 'desc' }
    });
    
    // קבלת כל ה-sessions
    const sessions = await prisma.contactSession.findMany({
      where: { contactId },
      include: {
        events: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { lastSeenAt: 'desc' }
    });
    
    res.json({
      contact,
      clicks,
      sessions,
      totalClicks: clicks.length,
      totalSessions: sessions.length
    });
  } catch (error) {
    console.error('Error getting contact activity:', error);
    res.status(500).json({ error: error.message });
  }
});

// קבלת קישורים מקוצרים של המשתמש
router.get('/links', authenticateToken, async (req, res) => {
  try {
    const { active = 'true' } = req.query;
    
    const where = {
      userId: req.user.id
    };
    
    if (active === 'true') {
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ];
    }
    
    const links = await prisma.shortLink.findMany({
      where,
      include: {
        _count: {
          select: {
            clicks: true,
            smsLinks: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(links);
  } catch (error) {
    console.error('Error getting short links:', error);
    res.status(500).json({ error: error.message });
  }
});

// יצירת דוח מעקב
router.post('/report', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, type = 'summary' } = req.body;
    
    const dateFilter = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }
    
    // קבלת נתונים לדוח
    const [smsMessages, clicks, sessions] = await Promise.all([
      // הודעות SMS
      prisma.smsMessage.findMany({
        where: {
          userId: req.user.id,
          createdAt: dateFilter
        },
        include: {
          smsLinks: {
            include: {
              clicks: true
            }
          }
        }
      }),
      
      // קליקים
      prisma.linkClick.findMany({
        where: {
          shortLink: {
            userId: req.user.id
          },
          clickedAt: dateFilter
        }
      }),
      
      // Sessions
      prisma.contactSession.findMany({
        where: {
          contact: {
            userId: req.user.id
          },
          createdAt: dateFilter
        },
        include: {
          events: true
        }
      })
    ]);
    
    const report = {
      period: {
        start: startDate || 'תחילת הזמן',
        end: endDate || 'היום'
      },
      summary: {
        totalSmsMessages: smsMessages.length,
        totalClicks: clicks.length,
        totalSessions: sessions.length,
        uniqueClickers: new Set(clicks.map(c => c.contactId).filter(Boolean)).size,
        averageClicksPerMessage: smsMessages.length > 0
          ? clicks.length / smsMessages.length
          : 0
      },
      topLinks: [], // ניתן להרחיב בעתיד
      topCampaigns: [] // ניתן להרחיב בעתיד
    };
    
    res.json(report);
  } catch (error) {
    console.error('Error generating tracking report:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
