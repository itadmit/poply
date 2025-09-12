const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const smsService = require('../services/smsService');

// Middleware לבדיקת API key
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;

    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key חסר',
        message: 'יש לשלוח API key בהדר X-API-Key או כפרמטר apiKey'
      });
    }

    const validKey = await smsService.validateApiKey(apiKey);
    
    if (!validKey) {
      return res.status(401).json({ 
        error: 'API key לא תקף',
        message: 'ה-API key שסופק אינו תקף או לא פעיל'
      });
    }

    req.user = validKey.user;
    req.apiKey = validKey;
    next();
  } catch (error) {
    console.error('API Key authentication error:', error);
    res.status(500).json({ error: 'שגיאה באימות' });
  }
};

// שליחת SMS - API פשוט
router.post('/send', authenticateApiKey, async (req, res) => {
  try {
    const { to, message, from } = req.body;

    // בדיקת פרמטרים
    if (!to || !message) {
      return res.status(400).json({
        error: 'חסרים פרמטרים חובה',
        message: 'יש לשלוח to (מספר טלפון) ו-message (תוכן ההודעה)',
        example: {
          to: '0501234567',
          message: 'הודעת טקסט לדוגמה',
          from: 'MyCompany' // אופציונלי
        }
      });
    }

    // בדיקת פורמט מספר טלפון
    const phoneRegex = /^05\d{8}$/;
    if (!phoneRegex.test(to)) {
      return res.status(400).json({
        error: 'מספר טלפון לא תקין',
        message: 'יש לשלוח מספר טלפון ישראלי תקין (10 ספרות המתחילות ב-05)'
      });
    }

    // שליחת ההודעה
    const result = await smsService.sendSms(
      req.user.id,
      to,
      message,
      from || req.user.smsSenderName
    );

    // תגובה מוצלחת
    res.json({
      success: true,
      messageId: result.messageId,
      balance: req.user.smsBalance - 1,
      message: 'ההודעה נשלחה בהצלחה'
    });

  } catch (error) {
    console.error('API SMS send error:', error);
    
    // טיפול בשגיאות ספציפיות
    if (error.message.includes('יתרת SMS')) {
      return res.status(402).json({
        error: 'אין יתרת SMS',
        message: 'יתרת ה-SMS שלך אזלה. צור קשר לקבלת חבילה נוספת'
      });
    }

    res.status(500).json({
      error: 'שגיאה בשליחת ההודעה',
      message: error.message
    });
  }
});

// שליחת SMS מרובה
router.post('/send-bulk', authenticateApiKey, async (req, res) => {
  try {
    const { recipients, message, from } = req.body;

    // בדיקת פרמטרים
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0 || !message) {
      return res.status(400).json({
        error: 'חסרים פרמטרים חובה',
        message: 'יש לשלוח recipients (מערך של מספרי טלפון) ו-message (תוכן ההודעה)',
        example: {
          recipients: ['0501234567', '0521234567'],
          message: 'הודעת טקסט לדוגמה',
          from: 'MyCompany' // אופציונלי
        }
      });
    }

    // בדיקת מספרי טלפון
    const phoneRegex = /^05\d{8}$/;
    const invalidNumbers = recipients.filter(num => !phoneRegex.test(num));
    
    if (invalidNumbers.length > 0) {
      return res.status(400).json({
        error: 'מספרי טלפון לא תקינים',
        message: 'חלק מהמספרים אינם תקינים',
        invalidNumbers
      });
    }

    // הכנת רשימת נמענים
    const recipientsList = recipients.map(phone => ({ phone }));

    // שליחת ההודעות
    const result = await smsService.sendBulkSms(
      req.user.id,
      recipientsList,
      message,
      from || req.user.smsSenderName
    );

    // תגובה מוצלחת
    res.json({
      success: true,
      sent: result.sent,
      messageIds: result.messageIds,
      balance: req.user.smsBalance - result.sent,
      message: `${result.sent} הודעות נשלחו בהצלחה`
    });

  } catch (error) {
    console.error('API bulk SMS send error:', error);
    
    if (error.message.includes('יתרת SMS')) {
      return res.status(402).json({
        error: 'אין מספיק יתרת SMS',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'שגיאה בשליחת ההודעות',
      message: error.message
    });
  }
});

// בדיקת יתרה
router.get('/balance', authenticateApiKey, async (req, res) => {
  try {
    res.json({
      balance: req.user.smsBalance,
      currency: 'SMS'
    });
  } catch (error) {
    console.error('API balance check error:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת יתרה',
      message: error.message
    });
  }
});

// קבלת היסטוריית שליחות
router.get('/history', authenticateApiKey, async (req, res) => {
  try {
    const { from, to, status, limit = 100, offset = 0 } = req.query;

    const messages = await smsService.getUserSmsHistory(req.user.id, {
      from,
      to,
      status
    });

    // פגינציה
    const paginatedMessages = messages.slice(offset, offset + limit);

    res.json({
      total: messages.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
      messages: paginatedMessages.map(msg => ({
        id: msg.id,
        to: msg.recipient,
        from: msg.sender,
        message: msg.content,
        status: msg.status,
        sentAt: msg.sentAt,
        deliveredAt: msg.deliveredAt,
        failedAt: msg.failedAt
      }))
    });
  } catch (error) {
    console.error('API history error:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת היסטוריה',
      message: error.message
    });
  }
});

// קבלת פרטי הודעה בודדת
router.get('/message/:id', authenticateApiKey, async (req, res) => {
  try {
    const message = await prisma.smsMessage.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!message) {
      return res.status(404).json({
        error: 'הודעה לא נמצאה',
        message: 'לא נמצאה הודעה עם המזהה שצוין'
      });
    }

    res.json({
      id: message.id,
      to: message.recipient,
      from: message.sender,
      message: message.content,
      status: message.status,
      sentAt: message.sentAt,
      deliveredAt: message.deliveredAt,
      failedAt: message.failedAt
    });
  } catch (error) {
    console.error('API message details error:', error);
    res.status(500).json({
      error: 'שגיאה בקבלת פרטי הודעה',
      message: error.message
    });
  }
});

// דף תיעוד API
router.get('/docs', (req, res) => {
  const docs = {
    title: 'SMS API Documentation',
    version: '1.0',
    baseUrl: '/api/v1/sms',
    authentication: {
      method: 'API Key',
      header: 'X-API-Key',
      description: 'יש לשלוח את ה-API key בהדר X-API-Key או כפרמטר apiKey ב-query string'
    },
    endpoints: [
      {
        method: 'POST',
        path: '/send',
        description: 'שליחת SMS בודד',
        headers: {
          'X-API-Key': 'your-api-key',
          'Content-Type': 'application/json'
        },
        body: {
          to: 'מספר טלפון (חובה) - פורמט: 05XXXXXXXX',
          message: 'תוכן ההודעה (חובה)',
          from: 'שם השולח (אופציונלי) - עד 11 תווים'
        },
        response: {
          success: true,
          messageId: 'מזהה ההודעה',
          balance: 'יתרה נוכחית',
          message: 'הודעת אישור'
        }
      },
      {
        method: 'POST',
        path: '/send-bulk',
        description: 'שליחת SMS מרובה',
        headers: {
          'X-API-Key': 'your-api-key',
          'Content-Type': 'application/json'
        },
        body: {
          recipients: ['0501234567', '0521234567'],
          message: 'תוכן ההודעה (חובה)',
          from: 'שם השולח (אופציונלי)'
        },
        response: {
          success: true,
          sent: 'מספר הודעות שנשלחו',
          messageIds: ['מערך של מזהי הודעות'],
          balance: 'יתרה נוכחית',
          message: 'הודעת אישור'
        }
      },
      {
        method: 'GET',
        path: '/balance',
        description: 'בדיקת יתרת SMS',
        headers: {
          'X-API-Key': 'your-api-key'
        },
        response: {
          balance: 100,
          currency: 'SMS'
        }
      },
      {
        method: 'GET',
        path: '/history',
        description: 'קבלת היסטוריית שליחות',
        headers: {
          'X-API-Key': 'your-api-key'
        },
        queryParams: {
          from: 'תאריך התחלה (YYYY-MM-DD)',
          to: 'תאריך סיום (YYYY-MM-DD)',
          status: 'סטטוס (PENDING/SENT/DELIVERED/FAILED)',
          limit: 'מספר תוצאות (ברירת מחדל: 100)',
          offset: 'דילוג על תוצאות (ברירת מחדל: 0)'
        }
      },
      {
        method: 'GET',
        path: '/message/:id',
        description: 'קבלת פרטי הודעה בודדת',
        headers: {
          'X-API-Key': 'your-api-key'
        }
      }
    ],
    errors: {
      400: 'בקשה לא תקינה - חסרים פרמטרים או פורמט שגוי',
      401: 'אימות נכשל - API key חסר או לא תקף',
      402: 'אין יתרה מספקת',
      404: 'לא נמצא',
      500: 'שגיאת שרת'
    }
  };

  res.json(docs);
});

module.exports = router;
