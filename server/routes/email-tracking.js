const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Track email open
router.get('/open/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    // Update tracking record
    const tracking = await prisma.emailTracking.update({
      where: { messageId },
      data: {
        openedAt: new Date(),
        openCount: { increment: 1 },
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      }
    });

    // Create event
    if (tracking.contactId) {
      await prisma.event.create({
        data: {
          type: 'EMAIL_OPEN',
          contactId: tracking.contactId,
          campaignId: tracking.campaignId,
          data: {
            messageId,
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
          }
        }
      });
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-store, no-cache, must-revalidate, private'
    });
    res.end(pixel);
    
  } catch (error) {
    console.error('Error tracking email open:', error);
    // Still return pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.writeHead(200, { 'Content-Type': 'image/gif' });
    res.end(pixel);
  }
});

// Track link click
router.get('/click/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).send('Missing URL parameter');
    }

    // Decode URL
    const targetUrl = decodeURIComponent(url);
    
    // Update tracking record
    const tracking = await prisma.emailTracking.update({
      where: { messageId },
      data: {
        clickedAt: new Date(),
        clickCount: { increment: 1 },
        clicks: {
          push: {
            url: targetUrl,
            clickedAt: new Date(),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
          }
        }
      }
    });

    // Create event
    if (tracking.contactId) {
      await prisma.event.create({
        data: {
          type: 'EMAIL_CLICK',
          contactId: tracking.contactId,
          campaignId: tracking.campaignId,
          data: {
            messageId,
            url: targetUrl,
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip
          }
        }
      });
    }

    // Redirect to target URL
    res.redirect(301, targetUrl);
    
  } catch (error) {
    console.error('Error tracking link click:', error);
    // Redirect to URL anyway
    const targetUrl = req.query.url ? decodeURIComponent(req.query.url) : '/';
    res.redirect(301, targetUrl);
  }
});

// Get email statistics
router.get('/stats/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const tracking = await prisma.emailTracking.findUnique({
      where: { messageId },
      include: {
        contact: true,
        campaign: true
      }
    });

    if (!tracking) {
      return res.status(404).json({ error: 'Tracking record not found' });
    }

    res.json({
      messageId: tracking.messageId,
      to: tracking.to,
      subject: tracking.subject,
      status: tracking.status,
      sentAt: tracking.sentAt,
      openedAt: tracking.openedAt,
      clickedAt: tracking.clickedAt,
      openCount: tracking.openCount,
      clickCount: tracking.clickCount,
      clicks: tracking.clicks,
      contact: tracking.contact,
      campaign: tracking.campaign
    });
    
  } catch (error) {
    console.error('Error getting email stats:', error);
    res.status(500).json({ error: 'Failed to get email statistics' });
  }
});

// Get campaign email statistics
router.get('/campaign/:campaignId/stats', async (req, res) => {
  try {
    const { campaignId } = req.params;
    
    const stats = await prisma.emailTracking.aggregate({
      where: { campaignId },
      _count: {
        _all: true,
        openedAt: true,
        clickedAt: true,
        bouncedAt: true,
        unsubscribedAt: true
      }
    });

    const detailedStats = await prisma.emailTracking.findMany({
      where: { campaignId },
      select: {
        openCount: true,
        clickCount: true
      }
    });

    const totalOpens = detailedStats.reduce((sum, record) => sum + record.openCount, 0);
    const totalClicks = detailedStats.reduce((sum, record) => sum + record.clickCount, 0);

    res.json({
      campaignId,
      sent: stats._count._all,
      uniqueOpens: stats._count.openedAt,
      uniqueClicks: stats._count.clickedAt,
      totalOpens,
      totalClicks,
      bounced: stats._count.bouncedAt,
      unsubscribed: stats._count.unsubscribedAt,
      openRate: stats._count._all > 0 ? (stats._count.openedAt / stats._count._all * 100).toFixed(2) : 0,
      clickRate: stats._count._all > 0 ? (stats._count.clickedAt / stats._count._all * 100).toFixed(2) : 0,
      clickToOpenRate: stats._count.openedAt > 0 ? (stats._count.clickedAt / stats._count.openedAt * 100).toFixed(2) : 0
    });
    
  } catch (error) {
    console.error('Error getting campaign stats:', error);
    res.status(500).json({ error: 'Failed to get campaign statistics' });
  }
});

module.exports = router;
