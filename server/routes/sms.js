const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken } = require('../middleware/auth');
const smsService = require('../services/smsService');

// שליחת SMS בודד
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { recipient, content, contactId } = req.body;

    if (!recipient || !content) {
      return res.status(400).json({ error: 'חובה לציין נמען ותוכן הודעה' });
    }

    // קבלת שם השולח מהגדרות המשתמש
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { smsSenderName: true }
    });

    const result = await smsService.sendSms(
      req.user.id,
      recipient,
      content,
      user.smsSenderName || undefined,
      null,
      contactId
    );

    res.json(result);
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({ error: error.message });
  }
});

// שליחת SMS לקמפיין
router.post('/send-campaign', authenticateToken, async (req, res) => {
  try {
    const { campaignId, recipients, content } = req.body;

    if (!recipients || !recipients.length || !content) {
      return res.status(400).json({ error: 'חובה לציין נמענים ותוכן הודעה' });
    }

    // קבלת שם השולח מהגדרות המשתמש
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { smsSenderName: true }
    });

    const result = await smsService.sendBulkSms(
      req.user.id,
      recipients,
      content,
      user.smsSenderName || undefined,
      campaignId
    );

    // עדכון סטטוס הקמפיין
    if (campaignId) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error sending campaign SMS:', error);
    res.status(500).json({ error: error.message });
  }
});

// קבלת היסטוריית SMS
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { status, campaignId, from, to } = req.query;
    
    const messages = await smsService.getUserSmsHistory(req.user.id, {
      status,
      campaignId,
      from,
      to
    });

    res.json(messages);
  } catch (error) {
    console.error('Error getting SMS history:', error);
    res.status(500).json({ error: error.message });
  }
});

// קבלת סטטיסטיקות SMS
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const stats = await smsService.getSmsStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Error getting SMS stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// קבלת יתרת SMS
router.get('/balance', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { smsBalance: true }
    });

    res.json({ balance: user?.smsBalance || 0 });
  } catch (error) {
    console.error('Error getting SMS balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// הוספת חבילת SMS (לאדמין בלבד)
router.post('/packages', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'אין הרשאה' });
    }

    const { userId, name, amount, price } = req.body;

    if (!userId || !name || !amount || !price) {
      return res.status(400).json({ error: 'חסרים פרטים' });
    }

    const smsPackage = await smsService.addSmsPackage(userId, {
      name,
      amount,
      price
    });

    res.json(smsPackage);
  } catch (error) {
    console.error('Error adding SMS package:', error);
    res.status(500).json({ error: error.message });
  }
});

// קבלת חבילות SMS של משתמש
router.get('/packages', authenticateToken, async (req, res) => {
  try {
    const packages = await prisma.smsPackage.findMany({
      where: { userId: req.user.id },
      orderBy: { purchasedAt: 'desc' }
    });

    res.json(packages);
  } catch (error) {
    console.error('Error getting SMS packages:', error);
    res.status(500).json({ error: error.message });
  }
});

// עדכון הגדרות SMS
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const { smsSenderName } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { smsSenderName },
      select: {
        id: true,
        smsSenderName: true,
        smsBalance: true
      }
    });

    res.json(user);
  } catch (error) {
    console.error('Error updating SMS settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// יצירת API key
router.post('/api-keys', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'חובה לציין שם ל-API key' });
    }

    const apiKey = await smsService.createApiKey(req.user.id, name);
    res.json(apiKey);
  } catch (error) {
    console.error('Error creating API key:', error);
    res.status(500).json({ error: error.message });
  }
});

// קבלת API keys
router.get('/api-keys', authenticateToken, async (req, res) => {
  try {
    const apiKeys = await prisma.smsApiKey.findMany({
      where: { userId: req.user.id },
      select: {
        id: true,
        name: true,
        key: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(apiKeys);
  } catch (error) {
    console.error('Error getting API keys:', error);
    res.status(500).json({ error: error.message });
  }
});

// מחיקת API key
router.delete('/api-keys/:id', authenticateToken, async (req, res) => {
  try {
    await prisma.smsApiKey.delete({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook לקבלת סטטוסים מ-SMS4FREE
router.post('/webhook/status', async (req, res) => {
  try {
    const { to, status } = req.query;

    if (!to || !status) {
      return res.status(400).json({ error: 'חסרים פרמטרים' });
    }

    await smsService.updateSmsStatus(to, parseInt(status));
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling SMS status webhook:', error);
    res.status(500).json({ error: error.message });
  }
});

// בדיקת יתרה ב-SMS4FREE (לאדמין בלבד)
router.get('/check-provider-balance', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'אין הרשאה' });
    }

    const balance = await smsService.checkSms4FreeBalance();
    res.json(balance);
  } catch (error) {
    console.error('Error checking provider balance:', error);
    res.status(500).json({ error: error.message });
  }
});

// קבלת הגדרות SMS
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        smsSenderName: true,
        smsBalance: true
      }
    });

    res.json({
      senderName: user.smsSenderName || '',
      balance: user.smsBalance || 0
    });
  } catch (error) {
    console.error('Error fetching SMS settings:', error);
    res.status(500).json({ error: 'שגיאה בטעינת הגדרות' });
  }
});

// עדכון הגדרות SMS
router.post('/settings', authenticateToken, async (req, res) => {
  try {
    const { senderName } = req.body;

    // בדיקת תקינות השם
    if (senderName && senderName.length > 11) {
      return res.status(400).json({ error: 'שם השולח יכול להכיל עד 11 תווים' });
    }

    // בדיקה שהשם מכיל רק אותיות באנגלית או מספרים
    if (senderName && !/^[a-zA-Z0-9\s]*$/.test(senderName)) {
      return res.status(400).json({ error: 'שם השולח יכול להכיל רק אותיות באנגלית ומספרים' });
    }

    // עדכון השם במסד הנתונים
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        smsSenderName: senderName || null
      },
      select: {
        smsSenderName: true,
        smsBalance: true
      }
    });

    res.json({
      success: true,
      senderName: updatedUser.smsSenderName || '',
      balance: updatedUser.smsBalance || 0
    });
  } catch (error) {
    console.error('Error updating SMS settings:', error);
    res.status(500).json({ error: 'שגיאה בעדכון הגדרות' });
  }
});

module.exports = router;
