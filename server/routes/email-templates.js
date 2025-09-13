const express = require('express');
const router = express.Router();
const emailTemplates = require('../services/emailTemplates');
const { authenticateToken: auth } = require('../middleware/auth');

// יצירת תבנית מייל חדשה
router.post('/', auth, async (req, res) => {
  try {
    const templateData = req.body;
    const template = await emailTemplates.createEmailTemplate(req.user.id, templateData);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating email template:', error);
    res.status(400).json({ error: error.message });
  }
});

// קבלת תבניות מייל
router.get('/', auth, async (req, res) => {
  try {
    const filters = req.query;
    const templates = await emailTemplates.getEmailTemplates(req.user.id, filters);
    res.json(templates);
  } catch (error) {
    console.error('Error getting email templates:', error);
    res.status(500).json({ error: 'Failed to get email templates' });
  }
});

// קבלת תבנית מייל ספציפית
router.get('/:templateId', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const template = await emailTemplates.getEmailTemplate(templateId, req.user.id);
    res.json(template);
  } catch (error) {
    console.error('Error getting email template:', error);
    if (error.message === 'Email template not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get email template' });
    }
  }
});

// עדכון תבנית מייל
router.put('/:templateId', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const updateData = req.body;
    const template = await emailTemplates.updateEmailTemplate(templateId, req.user.id, updateData);
    res.json(template);
  } catch (error) {
    console.error('Error updating email template:', error);
    if (error.message === 'Email template not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to update email template' });
    }
  }
});

// מחיקת תבנית מייל
router.delete('/:templateId', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    await emailTemplates.deleteEmailTemplate(templateId, req.user.id);
    res.json({ message: 'Email template deleted successfully' });
  } catch (error) {
    console.error('Error deleting email template:', error);
    if (error.message === 'Email template not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to delete email template' });
    }
  }
});

// שכפול תבנית מייל
router.post('/:templateId/duplicate', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { name } = req.body;
    const template = await emailTemplates.duplicateEmailTemplate(templateId, req.user.id, name);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error duplicating email template:', error);
    if (error.message === 'Email template not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to duplicate email template' });
    }
  }
});

// יצירת תבנית מתוך HTML
router.post('/from-html', auth, async (req, res) => {
  try {
    const templateData = req.body;
    const template = await emailTemplates.createTemplateFromHTML(req.user.id, templateData);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template from HTML:', error);
    res.status(400).json({ error: error.message });
  }
});

// תצוגה מקדימה של תבנית
router.post('/:templateId/preview', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { contactId, customData } = req.body;
    
    const preview = await emailTemplates.previewTemplate(templateId, req.user.id, contactId, customData);
    res.json(preview);
  } catch (error) {
    console.error('Error previewing template:', error);
    if (error.message === 'Template not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to preview template' });
    }
  }
});

// שליחת מייל בדיקה
router.post('/:templateId/send-test', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const testData = req.body;
    
    const result = await emailTemplates.sendTestEmail(templateId, req.user.id, testData);
    res.json(result);
  } catch (error) {
    console.error('Error sending test email:', error);
    if (error.message === 'Template not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to send test email' });
    }
  }
});

// קבלת סטטיסטיקות תבנית
router.get('/:templateId/stats', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { timeframe = 30 } = req.query;
    
    const stats = await emailTemplates.getTemplateStats(templateId, req.user.id, parseInt(timeframe));
    res.json(stats);
  } catch (error) {
    console.error('Error getting template stats:', error);
    if (error.message === 'Template not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to get template stats' });
    }
  }
});

// יצוא תבנית
router.get('/:templateId/export', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { format = 'json' } = req.query;
    
    const exportData = await emailTemplates.exportTemplate(templateId, req.user.id, format);
    
    if (format === 'html') {
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename=template-${templateId}.html`);
      res.send(exportData);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=template-${templateId}.json`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting template:', error);
    if (error.message === 'Template not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to export template' });
    }
  }
});

// ייבוא תבנית
router.post('/import', auth, async (req, res) => {
  try {
    const { importData, templateName } = req.body;
    
    if (!importData) {
      return res.status(400).json({ error: 'Import data is required' });
    }
    
    const template = await emailTemplates.importTemplate(req.user.id, importData, templateName);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error importing template:', error);
    res.status(400).json({ error: error.message });
  }
});

// קבלת תבניות פופולריות
router.get('/popular/list', auth, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const templates = await emailTemplates.getPopularTemplates(req.user.id, parseInt(limit));
    res.json(templates);
  } catch (error) {
    console.error('Error getting popular templates:', error);
    res.status(500).json({ error: 'Failed to get popular templates' });
  }
});

// קבלת המלצות לתבניות
router.get('/recommendations/list', auth, async (req, res) => {
  try {
    const context = req.query;
    const recommendations = await emailTemplates.getTemplateRecommendations(req.user.id, context);
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting template recommendations:', error);
    res.status(500).json({ error: 'Failed to get template recommendations' });
  }
});

// קבלת קטגוריות זמינות
router.get('/categories/list', auth, async (req, res) => {
  try {
    const categories = [
      { value: 'GENERAL', label: 'כללי' },
      { value: 'WELCOME', label: 'ברוכים הבאים' },
      { value: 'PROMOTIONAL', label: 'קידום מכירות' },
      { value: 'TRANSACTIONAL', label: 'עסקאות' },
      { value: 'NEWSLETTER', label: 'ניוזלטר' },
      { value: 'CART_ABANDONMENT', label: 'נטישת עגלה' },
      { value: 'WIN_BACK', label: 'החזרת לקוחות' },
      { value: 'BIRTHDAY', label: 'יום הולדת' },
      { value: 'SEASONAL', label: 'עונתי' },
      { value: 'CUSTOM', label: 'מותאם אישית' }
    ];
    
    res.json(categories);
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// קבלת משתנים זמינים לפרסונליזציה
router.get('/variables/available', auth, async (req, res) => {
  try {
    const variables = [
      { name: 'firstName', label: 'שם פרטי', description: 'השם הפרטי של הלקוח' },
      { name: 'lastName', label: 'שם משפחה', description: 'שם המשפחה של הלקוח' },
      { name: 'fullName', label: 'שם מלא', description: 'השם המלא של הלקוח' },
      { name: 'email', label: 'אימייל', description: 'כתובת האימייל של הלקוח' },
      { name: 'company', label: 'חברה', description: 'שם החברה של הלקוח' },
      { name: 'totalOrders', label: 'מספר הזמנות', description: 'מספר ההזמנות הכולל' },
      { name: 'totalSpent', label: 'סכום כולל', description: 'הסכום הכולל שהוציא הלקוח' },
      { name: 'lastOrderDate', label: 'תאריך הזמנה אחרונה', description: 'תאריך ההזמנה האחרונה' },
      { name: 'productName', label: 'שם מוצר', description: 'שם המוצר הרלוונטי' },
      { name: 'discountCode', label: 'קוד הנחה', description: 'קוד הנחה מיוחד' },
      { name: 'timeGreeting', label: 'ברכת זמן', description: 'ברכה בהתאם לשעה' },
      { name: 'segmentMessage', label: 'הודעת סגמנט', description: 'הודעה מותאמת לסגמנט הלקוח' },
      { name: 'personalMessage', label: 'הודעה אישית', description: 'הודעה מותאמת אישית' },
      { name: 'productRecommendations', label: 'המלצות מוצרים', description: 'המלצות מוצרים מותאמות' }
    ];
    
    res.json(variables);
  } catch (error) {
    console.error('Error getting available variables:', error);
    res.status(500).json({ error: 'Failed to get available variables' });
  }
});

module.exports = router;
