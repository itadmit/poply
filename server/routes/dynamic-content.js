const express = require('express');
const router = express.Router();
const dynamicContent = require('../services/dynamicContent');
const { authenticateToken: auth } = require('../middleware/auth');

// יצירת תוכן דינמי לקונטקט
router.post('/generate/:contactId', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { templateType, baseContent } = req.body;

    if (!templateType || !baseContent) {
      return res.status(400).json({ error: 'Template type and base content are required' });
    }

    const personalizedContent = await dynamicContent.generatePersonalizedContent(
      contactId, 
      templateType, 
      baseContent
    );

    res.json(personalizedContent);
  } catch (error) {
    console.error('Error generating dynamic content:', error);
    res.status(500).json({ error: 'Failed to generate dynamic content' });
  }
});

// יצירת מייל דינמי
router.post('/email/:contactId', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { emailTemplate } = req.body;

    if (!emailTemplate) {
      return res.status(400).json({ error: 'Email template is required' });
    }

    const dynamicEmail = await dynamicContent.generateDynamicEmail(contactId, emailTemplate);
    res.json(dynamicEmail);
  } catch (error) {
    console.error('Error generating dynamic email:', error);
    res.status(500).json({ error: 'Failed to generate dynamic email' });
  }
});

// יצירת SMS דינמי
router.post('/sms/:contactId', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { smsTemplate } = req.body;

    if (!smsTemplate) {
      return res.status(400).json({ error: 'SMS template is required' });
    }

    const dynamicSMS = await dynamicContent.generateDynamicSMS(contactId, smsTemplate);
    res.json(dynamicSMS);
  } catch (error) {
    console.error('Error generating dynamic SMS:', error);
    res.status(500).json({ error: 'Failed to generate dynamic SMS' });
  }
});

// יצירת פופאפ דינמי
router.post('/popup/:contactId', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { popupTemplate } = req.body;

    if (!popupTemplate) {
      return res.status(400).json({ error: 'Popup template is required' });
    }

    const dynamicPopup = await dynamicContent.generateDynamicPopup(contactId, popupTemplate);
    res.json(dynamicPopup);
  } catch (error) {
    console.error('Error generating dynamic popup:', error);
    res.status(500).json({ error: 'Failed to generate dynamic popup' });
  }
});

// תצוגה מקדימה של תוכן דינמי
router.post('/preview/:contactId', auth, async (req, res) => {
  try {
    const { contactId } = req.params;
    const { template, templateType } = req.body;

    if (!template || !templateType) {
      return res.status(400).json({ error: 'Template and template type are required' });
    }

    const preview = await dynamicContent.previewDynamicContent(contactId, template, templateType);
    res.json(preview);
  } catch (error) {
    console.error('Error previewing dynamic content:', error);
    res.status(500).json({ error: 'Failed to preview dynamic content' });
  }
});

// שמירת תבנית דינמית
router.post('/template', auth, async (req, res) => {
  try {
    const templateData = req.body;
    const template = await dynamicContent.saveDynamicTemplate(req.user.id, templateData);
    res.status(201).json(template);
  } catch (error) {
    console.error('Error saving dynamic template:', error);
    res.status(500).json({ error: 'Failed to save dynamic template' });
  }
});

// קבלת תבניות דינמיות
router.get('/templates', auth, async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const templates = await prisma.dynamicTemplate.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(templates);
  } catch (error) {
    console.error('Error getting dynamic templates:', error);
    res.status(500).json({ error: 'Failed to get dynamic templates' });
  }
});

// קבלת תבנית דינמית ספציפית
router.get('/template/:templateId', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const template = await prisma.dynamicTemplate.findFirst({
      where: { id: templateId, userId: req.user.id }
    });

    if (!template) {
      return res.status(404).json({ error: 'Dynamic template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error getting dynamic template:', error);
    res.status(500).json({ error: 'Failed to get dynamic template' });
  }
});

// עדכון תבנית דינמית
router.put('/template/:templateId', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const updateData = req.body;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const existingTemplate = await prisma.dynamicTemplate.findFirst({
      where: { id: templateId, userId: req.user.id }
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Dynamic template not found' });
    }

    const updatedTemplate = await prisma.dynamicTemplate.update({
      where: { id: templateId },
      data: updateData
    });

    res.json(updatedTemplate);
  } catch (error) {
    console.error('Error updating dynamic template:', error);
    res.status(500).json({ error: 'Failed to update dynamic template' });
  }
});

// מחיקת תבנית דינמית
router.delete('/template/:templateId', auth, async (req, res) => {
  try {
    const { templateId } = req.params;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const existingTemplate = await prisma.dynamicTemplate.findFirst({
      where: { id: templateId, userId: req.user.id }
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: 'Dynamic template not found' });
    }

    await prisma.dynamicTemplate.delete({
      where: { id: templateId }
    });

    res.json({ message: 'Dynamic template deleted successfully' });
  } catch (error) {
    console.error('Error deleting dynamic template:', error);
    res.status(500).json({ error: 'Failed to delete dynamic template' });
  }
});

module.exports = router;
