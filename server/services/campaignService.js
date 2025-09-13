const { PrismaClient } = require('@prisma/client');
const emailService = require('./emailService');
const smsQueueService = require('./smsQueueService');
const unsubscribeService = require('./unsubscribeService');

const prisma = new PrismaClient();

class CampaignService {
  
  // שליחת קמפיין אימייל - משתמש בשירות האימייל הקיים
  async sendEmailCampaign(campaign, contacts, userId) {
    const results = [];
    
    for (const campaignContact of contacts) {
      try {
        const contact = campaignContact.contact;
        
        // בדיקה אם איש הקשר הסיר את עצמו מקבלת אימיילים
        const canSend = await unsubscribeService.canSendMessage(contact.id, 'EMAIL');
        if (!canSend) {
          await prisma.campaignContact.update({
            where: { id: campaignContact.id },
            data: {
              status: 'FAILED',
              failedAt: new Date()
            }
          });
          results.push({ success: false, contactId: contact.id, error: 'איש הקשר הסיר את עצמו מקבלת אימיילים' });
          continue;
        }
        
        // החלפת משתנים בתוכן
        let processedContent = this.replaceVariables(campaign.content, contact);
        const processedSubject = this.replaceVariables(campaign.subject, contact);
        
        // הוספת לינק הסרה מדיוור
        processedContent = await unsubscribeService.addUnsubscribeLink(
          userId,
          contact.id,
          processedContent,
          'EMAIL'
        );
        
        // שליחה באמצעות שירות האימייל הקיים (כולל מעקב קליקים ופתיחות)
        await emailService.sendEmail({
          to: contact.email,
          subject: processedSubject,
          html: processedContent,
          campaignId: campaign.id,
          contactId: contact.id
        });
        
        // עדכון סטטוס
        await prisma.campaignContact.update({
          where: { id: campaignContact.id },
          data: {
            status: 'SENT',
            sentAt: new Date()
          }
        });
        
        results.push({ success: true, contactId: contact.id });
        
      } catch (error) {
        console.error(`Error sending email to ${campaignContact.contact.email}:`, error);
        
        await prisma.campaignContact.update({
          where: { id: campaignContact.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            errorMessage: error.message
          }
        });
        
        results.push({ success: false, contactId: campaignContact.contact.id, error: error.message });
      }
    }
    
    return results;
  }
  
  // שליחת קמפיין SMS - משתמש בשירות ה-SMS הקיים
  async sendSmsCampaign(campaign, contacts, userId) {
    const results = [];
    
    for (const campaignContact of contacts) {
      try {
        const contact = campaignContact.contact;
        
        if (!contact.phone) {
          throw new Error('No phone number for contact');
        }
        
        // החלפת משתנים בתוכן
        const processedContent = this.replaceVariables(campaign.content, contact);
        
        // שליחה באמצעות שירות ה-SMS החדש עם תור ברקע (כולל קיצור קישורים ושם שולח)
        await smsQueueService.sendSms(
          userId,
          contact.phone,
          processedContent,
          null, // ישתמש בשם השולח מהגדרות המשתמש
          campaign.id,
          contact.id,
          'CAMPAIGN' // סוג הודעה לקמפיין
        );
        
        // עדכון סטטוס
        await prisma.campaignContact.update({
          where: { id: campaignContact.id },
          data: {
            status: 'SENT',
            sentAt: new Date()
          }
        });
        
        results.push({ success: true, contactId: contact.id });
        
      } catch (error) {
        console.error(`Error sending SMS to ${campaignContact.contact.phone}:`, error);
        
        await prisma.campaignContact.update({
          where: { id: campaignContact.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            errorMessage: error.message
          }
        });
        
        results.push({ success: false, contactId: campaignContact.contact.id, error: error.message });
      }
    }
    
    return results;
  }
  
  // שליחת קמפיין התראות דחיפה
  async sendPushCampaign(campaign, contacts, userId) {
    // TODO: יישום שירות התראות דחיפה
    console.log('Push notifications not implemented yet');
    return [];
  }
  
  // החלפת משתנים בתוכן
  replaceVariables(content, contact) {
    return content
      .replace(/\{\{firstName\}\}/g, contact.firstName || '')
      .replace(/\{\{lastName\}\}/g, contact.lastName || '')
      .replace(/\{\{email\}\}/g, contact.email || '')
      .replace(/\{\{phone\}\}/g, contact.phone || '')
      .replace(/\{\{company\}\}/g, contact.company || '');
  }
  
  // שליחת קמפיין לפי סוג
  async sendCampaign(campaignId, userId) {
    try {
      // קבלת פרטי הקמפיין
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          contacts: {
            include: {
              contact: true
            }
          }
        }
      });

      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }

      if (campaign.contacts.length === 0) {
        throw new Error(`Campaign ${campaignId} has no contacts`);
      }

      // עדכון סטטוס לשליחה
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { 
          status: 'SENDING',
          sentAt: new Date()
        }
      });

      let results = [];
      
      // שליחה לפי סוג הקמפיין
      switch (campaign.type) {
        case 'EMAIL':
          results = await this.sendEmailCampaign(campaign, campaign.contacts, userId);
          break;
          
        case 'SMS':
          results = await this.sendSmsCampaign(campaign, campaign.contacts, userId);
          break;
          
        case 'PUSH':
          results = await this.sendPushCampaign(campaign, campaign.contacts, userId);
          break;
          
        default:
          throw new Error(`Unsupported campaign type: ${campaign.type}`);
      }
      
      // חישוב תוצאות
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      // עדכון סטטוס סופי
      const finalStatus = failureCount === 0 ? 'SENT' : 
                         successCount === 0 ? 'FAILED' : 'SENT';

      await prisma.campaign.update({
        where: { id: campaignId },
        data: { 
          status: finalStatus,
          completedAt: new Date()
        }
      });

      console.log(`Campaign ${campaignId} completed: ${successCount} success, ${failureCount} failures`);
      
      return {
        campaignId,
        totalContacts: campaign.contacts.length,
        successCount,
        failureCount,
        status: finalStatus,
        results
      };
      
    } catch (error) {
      console.error(`Campaign processing failed for ${campaignId}:`, error);
      
      // עדכון סטטוס לכישלון
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { 
          status: 'FAILED',
          completedAt: new Date()
        }
      });
      
      throw error;
    }
  }
}

module.exports = new CampaignService(); 