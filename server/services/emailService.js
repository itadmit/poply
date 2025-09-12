const sgMail = require('@sendgrid/mail');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Generate unique tracking ID
const generateTrackingId = () => crypto.randomBytes(16).toString('hex');

// Add tracking pixel to HTML emails
const addTrackingPixel = (html, trackingId) => {
  const trackingUrl = `${process.env.API_URL || 'http://localhost:3001'}/api/email-tracking/open/${trackingId}`;
  const pixel = `<img src="${trackingUrl}" width="1" height="1" style="display:block;border:0;" alt="" />`;
  
  // Add pixel before closing body tag or at the end
  if (html.includes('</body>')) {
    return html.replace('</body>', `${pixel}</body>`);
  }
  return html + pixel;
};

// Replace links with tracking links
const addLinkTracking = (html, trackingId) => {
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  
  // Replace all href links with tracking links
  return html.replace(
    /href="(https?:\/\/[^"]+)"/g,
    (match, url) => {
      // Don't track unsubscribe links or internal tracking links
      if (url.includes('unsubscribe') || url.includes('/api/email-tracking')) {
        return match;
      }
      const encodedUrl = encodeURIComponent(url);
      return `href="${baseUrl}/api/email-tracking/click/${trackingId}?url=${encodedUrl}"`;
    }
  );
};

const sendEmail = async ({ to, subject, html, text, campaignId = null, contactId = null }) => {
  try {
    const messageId = generateTrackingId();
    
    // Add tracking to HTML
    let trackedHtml = html;
    if (html) {
      trackedHtml = addTrackingPixel(html, messageId);
      trackedHtml = addLinkTracking(trackedHtml, messageId);
    }
    
    const msg = {
      to,
      from: {
        email: process.env.FROM_EMAIL || 'noreply@poply.co.il',
        name: 'Poply'
      },
      subject,
      text: text || '',
      html: trackedHtml || text,
      customArgs: {
        messageId: messageId
      },
      trackingSettings: {
        clickTracking: {
          enable: true,
          enableText: false
        },
        openTracking: {
          enable: true
        }
      }
    };

    const response = await sgMail.send(msg);
    
    // Save tracking info to database
    await prisma.emailTracking.create({
      data: {
        messageId,
        to,
        from: process.env.FROM_EMAIL || 'noreply@poply.co.il',
        subject,
        campaignId,
        contactId,
        status: 'sent'
      }
    });
    
    console.log('Email sent successfully:', response[0].statusCode);
    return { ...response, messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const sendBulkEmails = async (recipients, subject, html, text) => {
  try {
    const messages = recipients.map(recipient => ({
      to: recipient.email,
      from: {
        email: process.env.FROM_EMAIL || 'noreply@poply.co.il',
        name: 'Poply'
      },
      subject,
      text: text || '',
      html: html || text,
      substitutions: {
        firstName: recipient.firstName || '',
        lastName: recipient.lastName || '',
      }
    }));

    const response = await sgMail.send(messages);
    console.log('Bulk emails sent successfully');
    return response;
  } catch (error) {
    console.error('Error sending bulk emails:', error);
    throw error;
  }
};

const sendWelcomeEmail = async (user) => {
  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
      <h2>ברוכים הבאים ל-Poply!</h2>
      <p>שלום ${user.firstName},</p>
      <p>אנחנו שמחים שהצטרפת אלינו!</p>
      <p>עכשיו אתה יכול להתחיל ליצור קמפיינים, אוטומציות ועוד.</p>
      <br>
      <p>בברכה,<br>צוות Poply</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'ברוכים הבאים ל-Poply!',
    html
  });
};

const sendPasswordResetEmail = async (user, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right;">
      <h2>איפוס סיסמה</h2>
      <p>שלום ${user.firstName},</p>
      <p>קיבלנו בקשה לאיפוס הסיסמה שלך.</p>
      <p>לחץ על הקישור הבא כדי לאפס את הסיסמה:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #8b5cf6; color: white; text-decoration: none; border-radius: 5px;">אפס סיסמה</a>
      <p>הקישור תקף ל-24 שעות.</p>
      <br>
      <p>אם לא ביקשת איפוס סיסמה, אנא התעלם מהודעה זו.</p>
      <p>בברכה,<br>צוות Poply</p>
    </div>
  `;

  return sendEmail({
    to: user.email,
    subject: 'איפוס סיסמה - Poply',
    html
  });
};

module.exports = {
  sendEmail,
  sendBulkEmails,
  sendWelcomeEmail,
  sendPasswordResetEmail
};
