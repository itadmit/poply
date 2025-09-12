const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const dynamicContent = require('./dynamicContent');

class EmailTemplates {

  // יצירת תבנית מייל חדשה
  async createEmailTemplate(userId, templateData) {
    try {
      const {
        name,
        description,
        category,
        subject,
        htmlContent,
        textContent,
        previewText,
        isResponsive = true,
        variables = [],
        designSettings = {},
        isActive = true
      } = templateData;

      const template = await prisma.emailTemplate.create({
        data: {
          userId,
          name,
          description,
          category,
          subject,
          htmlContent,
          textContent,
          previewText,
          isResponsive,
          variables,
          designSettings,
          isActive
        }
      });

      return template;

    } catch (error) {
      console.error('Error creating email template:', error);
      throw error;
    }
  }

  // קבלת תבניות מייל
  async getEmailTemplates(userId, filters = {}) {
    try {
      const where = { userId };

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const templates = await prisma.emailTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              campaigns: true,
              usageStats: true
            }
          }
        }
      });

      return templates;

    } catch (error) {
      console.error('Error getting email templates:', error);
      throw error;
    }
  }

  // קבלת תבנית מייל ספציפית
  async getEmailTemplate(templateId, userId) {
    try {
      const template = await prisma.emailTemplate.findFirst({
        where: { id: templateId, userId },
        include: {
          usageStats: {
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      });

      if (!template) {
        throw new Error('Email template not found');
      }

      return template;

    } catch (error) {
      console.error('Error getting email template:', error);
      throw error;
    }
  }

  // עדכון תבנית מייל
  async updateEmailTemplate(templateId, userId, updateData) {
    try {
      const existingTemplate = await prisma.emailTemplate.findFirst({
        where: { id: templateId, userId }
      });

      if (!existingTemplate) {
        throw new Error('Email template not found');
      }

      const updatedTemplate = await prisma.emailTemplate.update({
        where: { id: templateId },
        data: {
          ...updateData,
          updatedAt: new Date()
        }
      });

      return updatedTemplate;

    } catch (error) {
      console.error('Error updating email template:', error);
      throw error;
    }
  }

  // מחיקת תבנית מייל
  async deleteEmailTemplate(templateId, userId) {
    try {
      const existingTemplate = await prisma.emailTemplate.findFirst({
        where: { id: templateId, userId }
      });

      if (!existingTemplate) {
        throw new Error('Email template not found');
      }

      await prisma.emailTemplate.delete({
        where: { id: templateId }
      });

      return { success: true };

    } catch (error) {
      console.error('Error deleting email template:', error);
      throw error;
    }
  }

  // שכפול תבנית מייל
  async duplicateEmailTemplate(templateId, userId, newName) {
    try {
      const originalTemplate = await prisma.emailTemplate.findFirst({
        where: { id: templateId, userId }
      });

      if (!originalTemplate) {
        throw new Error('Email template not found');
      }

      const duplicatedTemplate = await prisma.emailTemplate.create({
        data: {
          userId,
          name: newName || `${originalTemplate.name} (Copy)`,
          description: originalTemplate.description,
          category: originalTemplate.category,
          subject: originalTemplate.subject,
          htmlContent: originalTemplate.htmlContent,
          textContent: originalTemplate.textContent,
          previewText: originalTemplate.previewText,
          isResponsive: originalTemplate.isResponsive,
          variables: originalTemplate.variables,
          designSettings: originalTemplate.designSettings,
          isActive: false // תמיד יוצר כלא פעיל
        }
      });

      return duplicatedTemplate;

    } catch (error) {
      console.error('Error duplicating email template:', error);
      throw error;
    }
  }

  // יצירת תבנית מתוך HTML קיים
  async createTemplateFromHTML(userId, templateData) {
    try {
      const { name, htmlContent } = templateData;

      // ניתוח ה-HTML לחילוץ משתנים
      const variables = this.extractVariablesFromHTML(htmlContent);
      
      // חילוץ נושא מה-HTML (אם קיים)
      const subjectMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
      const subject = subjectMatch ? subjectMatch[1] : name;

      // יצירת תוכן טקסט פשוט
      const textContent = this.htmlToText(htmlContent);

      const template = await this.createEmailTemplate(userId, {
        name,
        subject,
        htmlContent,
        textContent,
        variables,
        category: 'custom',
        description: 'Created from HTML import'
      });

      return template;

    } catch (error) {
      console.error('Error creating template from HTML:', error);
      throw error;
    }
  }

  // חילוץ משתנים מ-HTML
  extractVariablesFromHTML(htmlContent) {
    const variablePattern = /\{\{(\w+)\}\}/g;
    const variables = [];
    let match;

    while ((match = variablePattern.exec(htmlContent)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  // המרת HTML לטקסט
  htmlToText(htmlContent) {
    return htmlContent
      .replace(/<[^>]*>/g, '') // הסרת תגי HTML
      .replace(/\s+/g, ' ') // החלפת רווחים מרובים ברווח יחיד
      .trim();
  }

  // יצירת preview של תבנית עם נתונים מותאמים אישית
  async previewTemplate(templateId, userId, contactId, customData = {}) {
    try {
      const template = await this.getEmailTemplate(templateId, userId);
      
      if (!template) {
        throw new Error('Template not found');
      }

      let previewContent = {
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent
      };

      // אם יש contactId, השתמש בפרסונליזציה
      if (contactId) {
        const personalizedEmail = await dynamicContent.generateDynamicEmail(contactId, template);
        previewContent = {
          subject: personalizedEmail.subject,
          htmlContent: personalizedEmail.content,
          textContent: this.htmlToText(personalizedEmail.content)
        };
      } else if (Object.keys(customData).length > 0) {
        // השתמש בנתונים מותאמים אישית
        previewContent = this.applyCustomData(template, customData);
      } else {
        // השתמש בנתוני דמה
        const sampleData = this.generateSampleData(template.variables);
        previewContent = this.applyCustomData(template, sampleData);
      }

      return {
        template,
        preview: previewContent,
        metadata: {
          previewedAt: new Date(),
          contactId,
          customData: Object.keys(customData).length > 0 ? customData : null
        }
      };

    } catch (error) {
      console.error('Error previewing template:', error);
      throw error;
    }
  }

  // החלת נתונים מותאמים אישית על תבנית
  applyCustomData(template, data) {
    let subject = template.subject;
    let htmlContent = template.htmlContent;
    let textContent = template.textContent;

    // החלפת משתנים בנושא
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      const value = data[key] || '';
      
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      htmlContent = htmlContent.replace(new RegExp(placeholder, 'g'), value);
      textContent = textContent.replace(new RegExp(placeholder, 'g'), value);
    });

    return { subject, htmlContent, textContent };
  }

  // יצירת נתוני דמה
  generateSampleData(variables) {
    const sampleData = {
      firstName: 'יוחנן',
      lastName: 'כהן',
      fullName: 'יוחנן כהן',
      email: 'yohanan@example.com',
      company: 'חברת דוגמה בע"מ',
      totalOrders: '5',
      totalSpent: '1,250₪',
      lastOrderDate: '15/12/2024',
      productName: 'מוצר מעולה',
      discountCode: 'SAVE20',
      timeGreeting: 'בוקר טוב',
      segmentMessage: 'כלקוח נאמן שלנו, יש לך הנחות מיוחדות'
    };

    const result = {};
    variables.forEach(variable => {
      result[variable] = sampleData[variable] || `[${variable}]`;
    });

    return result;
  }

  // שליחת מייל בדיקה
  async sendTestEmail(templateId, userId, testData) {
    try {
      const { recipientEmail, contactId, customData } = testData;

      const template = await this.getEmailTemplate(templateId, userId);
      if (!template) {
        throw new Error('Template not found');
      }

      // יצירת תוכן מותאם
      let emailContent;
      if (contactId) {
        emailContent = await dynamicContent.generateDynamicEmail(contactId, template);
      } else {
        const data = customData || this.generateSampleData(template.variables);
        emailContent = this.applyCustomData(template, data);
      }

      // שליחת המייל
      const emailService = require('./emailService');
      await emailService.sendEmail({
        to: recipientEmail,
        subject: `[TEST] ${emailContent.subject}`,
        html: emailContent.htmlContent,
        text: emailContent.textContent
      });

      // רישום שימוש בתבנית
      await this.recordTemplateUsage(templateId, 'test', { recipientEmail });

      return { success: true, message: 'Test email sent successfully' };

    } catch (error) {
      console.error('Error sending test email:', error);
      throw error;
    }
  }

  // רישום שימוש בתבנית
  async recordTemplateUsage(templateId, usageType, metadata = {}) {
    try {
      await prisma.templateUsage.create({
        data: {
          templateId,
          usageType,
          metadata,
          usedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error recording template usage:', error);
    }
  }

  // קבלת סטטיסטיקות תבנית
  async getTemplateStats(templateId, userId, timeframe = 30) {
    try {
      const template = await prisma.emailTemplate.findFirst({
        where: { id: templateId, userId }
      });

      if (!template) {
        throw new Error('Template not found');
      }

      const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);

      const usage = await prisma.templateUsage.findMany({
        where: {
          templateId,
          usedAt: { gte: startDate }
        }
      });

      const campaigns = await prisma.campaign.findMany({
        where: {
          userId,
          // templateId, // אם יש שדה templateId בקמפיינים
          createdAt: { gte: startDate }
        }
      });

      const stats = {
        totalUsage: usage.length,
        usageByType: usage.reduce((acc, u) => {
          acc[u.usageType] = (acc[u.usageType] || 0) + 1;
          return acc;
        }, {}),
        campaignsUsed: campaigns.length,
        lastUsed: usage.length > 0 
          ? usage.sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt))[0].usedAt
          : null,
        popularityScore: this.calculatePopularityScore(usage, campaigns)
      };

      return stats;

    } catch (error) {
      console.error('Error getting template stats:', error);
      throw error;
    }
  }

  // חישוב ציון פופולריות
  calculatePopularityScore(usage, campaigns) {
    const totalUsage = usage.length;
    const campaignUsage = campaigns.length;
    const recentUsage = usage.filter(u => 
      (Date.now() - new Date(u.usedAt).getTime()) < 7 * 24 * 60 * 60 * 1000
    ).length;

    return Math.min(100, (totalUsage * 2) + (campaignUsage * 5) + (recentUsage * 10));
  }

  // יצוא תבנית
  async exportTemplate(templateId, userId, format = 'json') {
    try {
      const template = await this.getEmailTemplate(templateId, userId);
      
      if (!template) {
        throw new Error('Template not found');
      }

      const exportData = {
        name: template.name,
        description: template.description,
        category: template.category,
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        previewText: template.previewText,
        variables: template.variables,
        designSettings: template.designSettings,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };

      if (format === 'html') {
        return template.htmlContent;
      }

      return exportData;

    } catch (error) {
      console.error('Error exporting template:', error);
      throw error;
    }
  }

  // ייבוא תבנית
  async importTemplate(userId, importData, templateName) {
    try {
      let templateData;

      if (typeof importData === 'string') {
        // אם זה HTML string
        templateData = {
          name: templateName || 'Imported Template',
          htmlContent: importData,
          category: 'imported'
        };
        
        return await this.createTemplateFromHTML(userId, templateData);
      } else {
        // אם זה JSON object
        templateData = {
          name: templateName || importData.name || 'Imported Template',
          description: importData.description || 'Imported template',
          category: importData.category || 'imported',
          subject: importData.subject || 'Imported Subject',
          htmlContent: importData.htmlContent,
          textContent: importData.textContent,
          previewText: importData.previewText,
          variables: importData.variables || [],
          designSettings: importData.designSettings || {}
        };

        return await this.createEmailTemplate(userId, templateData);
      }

    } catch (error) {
      console.error('Error importing template:', error);
      throw error;
    }
  }

  // קבלת תבניות פופולריות
  async getPopularTemplates(userId, limit = 10) {
    try {
      const templates = await prisma.emailTemplate.findMany({
        where: { userId, isActive: true },
        include: {
          usageStats: true,
          _count: {
            select: { usageStats: true }
          }
        }
      });

      // מיון לפי פופולריות
      const sortedTemplates = templates
        .map(template => ({
          ...template,
          popularityScore: this.calculatePopularityScore(template.usageStats, [])
        }))
        .sort((a, b) => b.popularityScore - a.popularityScore)
        .slice(0, limit);

      return sortedTemplates;

    } catch (error) {
      console.error('Error getting popular templates:', error);
      throw error;
    }
  }

  // קבלת המלצות לתבניות
  async getTemplateRecommendations(userId, context = {}) {
    try {
      const { category, lastUsedTemplates = [], campaignType } = context;

      const where = { 
        userId, 
        isActive: true,
        id: { notIn: lastUsedTemplates }
      };

      if (category) {
        where.category = category;
      }

      const recommendations = await prisma.emailTemplate.findMany({
        where,
        include: {
          _count: {
            select: { usageStats: true }
          }
        },
        take: 5,
        orderBy: [
          { updatedAt: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return recommendations.map(template => ({
        ...template,
        recommendationReason: this.getRecommendationReason(template, context)
      }));

    } catch (error) {
      console.error('Error getting template recommendations:', error);
      throw error;
    }
  }

  // קבלת סיבת המלצה
  getRecommendationReason(template, context) {
    if (template._count.usageStats > 5) {
      return 'תבנית פופולרית - נמצאת בשימוש תכוף';
    }
    
    if (template.category === context.category) {
      return `מתאימה לקטגוריה ${context.category}`;
    }

    if ((Date.now() - new Date(template.updatedAt).getTime()) < 7 * 24 * 60 * 60 * 1000) {
      return 'תבנית חדשה - עודכנה לאחרונה';
    }

    return 'תבנית מומלצת עבורך';
  }
}

module.exports = new EmailTemplates();
