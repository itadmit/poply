const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get overview statistics
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const where = {
      userId: req.user.id,
      ...dateFilter
    };

    const [
      totalContacts,
      activeCampaigns,
      totalRevenue,
      emailEvents,
      popupEvents,
      orderEvents
    ] = await Promise.all([
      prisma.contact.count({ where: { userId: req.user.id } }),
      prisma.campaign.count({ 
        where: { 
          userId: req.user.id, 
          status: 'SENT' 
        } 
      }),
      prisma.order.aggregate({
        where: { userId: req.user.id },
        _sum: { total: true }
      }),
      prisma.event.count({
        where: {
          userId: req.user.id,
          type: 'EMAIL_OPEN'
        }
      }),
      prisma.event.count({
        where: {
          userId: req.user.id,
          type: 'POPUP_SHOWN'
        }
      }),
      prisma.event.count({
        where: {
          userId: req.user.id,
          type: 'ORDER_COMPLETE'
        }
      })
    ]);

    // Calculate conversion rates
    const totalEmailOpens = await prisma.event.count({
      where: {
        userId: req.user.id,
        type: 'EMAIL_OPEN'
      }
    });

    const totalEmailClicks = await prisma.event.count({
      where: {
        userId: req.user.id,
        type: 'EMAIL_CLICK'
      }
    });

    const totalPopupShows = await prisma.event.count({
      where: {
        userId: req.user.id,
        type: 'POPUP_SHOWN'
      }
    });

    const totalPopupCloses = await prisma.event.count({
      where: {
        userId: req.user.id,
        type: 'POPUP_CLOSED'
      }
    });

    const emailOpenRate = totalEmailOpens > 0 ? (totalEmailClicks / totalEmailOpens) * 100 : 0;
    const popupConversionRate = totalPopupShows > 0 ? (totalPopupCloses / totalPopupShows) * 100 : 0;
    const conversionRate = totalContacts > 0 ? (orderEvents / totalContacts) * 100 : 0;

    // Calculate average order value
    const avgOrderValue = await prisma.order.aggregate({
      where: { userId: req.user.id },
      _avg: { total: true }
    });

    res.json({
      totalContacts,
      activeCampaigns,
      totalRevenue: totalRevenue._sum.total || 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
      emailOpenRate: Math.round(emailOpenRate * 100) / 100,
      clickRate: Math.round((totalEmailClicks / totalEmailOpens) * 100 * 100) / 100,
      popupConversion: Math.round(popupConversionRate * 100) / 100,
      avgOrderValue: avgOrderValue._avg.total || 0
    });
  } catch (error) {
    console.error('Get overview stats error:', error);
    res.status(500).json({ message: 'Failed to fetch overview statistics' });
  }
});

// Get email performance data
router.get('/email-performance', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    // Get campaign data grouped by time period
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: req.user.id,
        type: 'EMAIL',
        ...dateFilter
      },
      include: {
        contacts: true,
        events: {
          where: {
            type: { in: ['EMAIL_OPEN', 'EMAIL_CLICK'] }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by time period
    const groupedData = campaigns.reduce((acc, campaign) => {
      const date = new Date(campaign.createdAt);
      let key;
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!acc[key]) {
        acc[key] = {
          name: key,
          sent: 0,
          opened: 0,
          clicked: 0,
          revenue: 0
        };
      }

      acc[key].sent += campaign.contacts.length;
      acc[key].opened += campaign.events.filter(e => e.type === 'EMAIL_OPEN').length;
      acc[key].clicked += campaign.events.filter(e => e.type === 'EMAIL_CLICK').length;
      
      return acc;
    }, {});

    const result = Object.values(groupedData);
    res.json(result);
  } catch (error) {
    console.error('Get email performance error:', error);
    res.status(500).json({ message: 'Failed to fetch email performance data' });
  }
});

// Get campaign performance
router.get('/campaign-performance', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: req.user.id,
        ...dateFilter
      },
      include: {
        contacts: true,
        events: {
          where: {
            type: { in: ['EMAIL_OPEN', 'EMAIL_CLICK'] }
          }
        }
      }
    });

    const result = campaigns.map(campaign => {
      const sent = campaign.contacts.length;
      const opened = campaign.events.filter(e => e.type === 'EMAIL_OPEN').length;
      const clicked = campaign.events.filter(e => e.type === 'EMAIL_CLICK').length;
      const conversion = sent > 0 ? (clicked / sent) * 100 : 0;

      return {
        name: campaign.name,
        sent,
        opened,
        clicked,
        revenue: 0, // This would need to be calculated from orders
        conversion: Math.round(conversion * 100) / 100
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get campaign performance error:', error);
    res.status(500).json({ message: 'Failed to fetch campaign performance data' });
  }
});

// Get contact growth data
router.get('/contact-growth', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'month' } = req.query;
    
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const contacts = await prisma.contact.findMany({
      where: {
        userId: req.user.id,
        ...dateFilter
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by time period
    const groupedData = contacts.reduce((acc, contact) => {
      const date = new Date(contact.createdAt);
      let key;
      
      if (groupBy === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!acc[key]) {
        acc[key] = {
          name: key,
          new: 0,
          total: 0
        };
      }

      acc[key].new += 1;
      return acc;
    }, {});

    // Calculate cumulative totals
    let cumulativeTotal = 0;
    const result = Object.values(groupedData).map(item => {
      cumulativeTotal += item.new;
      return {
        ...item,
        total: cumulativeTotal
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get contact growth error:', error);
    res.status(500).json({ message: 'Failed to fetch contact growth data' });
  }
});

// Get revenue by source
router.get('/revenue-by-source', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    // This would need to be implemented based on your revenue tracking logic
    // For now, returning mock data structure
    const result = [
      { name: 'אימייל', value: 45, color: '#3B82F6' },
      { name: 'SMS', value: 25, color: '#10B981' },
      { name: 'פופאפים', value: 20, color: '#F59E0B' },
      { name: 'ישיר', value: 10, color: '#EF4444' }
    ];

    res.json(result);
  } catch (error) {
    console.error('Get revenue by source error:', error);
    res.status(500).json({ message: 'Failed to fetch revenue by source data' });
  }
});

// Get top products
router.get('/top-products', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const products = await prisma.product.findMany({
      where: {
        userId: req.user.id,
        ...dateFilter
      },
      include: {
        orders: true,
        _count: {
          select: { orders: true }
        }
      },
      orderBy: {
        orders: {
          _count: 'desc'
        }
      },
      take: parseInt(limit)
    });

    const result = products.map(product => ({
      name: product.name,
      sales: product._count.orders,
      revenue: product.orders.reduce((sum, order) => sum + order.total, 0)
    }));

    res.json(result);
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ message: 'Failed to fetch top products data' });
  }
});

// Get hourly activity
router.get('/hourly-activity', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = startDate && endDate ? {
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    } : {};

    const events = await prisma.event.findMany({
      where: {
        userId: req.user.id,
        ...dateFilter
      },
      select: {
        createdAt: true
      }
    });

    // Group by hour
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: `${String(i).padStart(2, '0')}:00`,
      activity: 0
    }));

    events.forEach(event => {
      const hour = new Date(event.createdAt).getHours();
      hourlyData[hour].activity += 1;
    });

    res.json(hourlyData);
  } catch (error) {
    console.error('Get hourly activity error:', error);
    res.status(500).json({ message: 'Failed to fetch hourly activity data' });
  }
});

module.exports = router;
