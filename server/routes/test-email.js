const express = require('express');
const router = express.Router();
const { sendEmail } = require('../services/emailService');

// Test email endpoint
router.post('/test', async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const testEmail = {
      to,
      subject: 'בדיקת מערכת Poply',
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8b5cf6;">ברוכים הבאים ל-Poply! 🎉</h2>
          <p>זהו מייל בדיקה כדי לוודא שמערכת השליחה עובדת כראוי.</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>פרטי הבדיקה:</h3>
            <ul>
              <li>שרת: SendGrid ✅</li>
              <li>דומיין: poply.co.il ✅</li>
              <li>זמן שליחה: ${new Date().toLocaleString('he-IL')}</li>
            </ul>
          </div>
          
          <p>אם אתה רואה מייל זה, המערכת עובדת מצוין!</p>
          
          <hr style="border: 1px solid #e5e7eb; margin: 30px 0;">
          
          <p style="color: #6b7280; font-size: 14px;">
            נשלח מ-Poply | מערכת ניהול שיווק מתקדמת
          </p>
        </div>
      `,
      text: 'זהו מייל בדיקה מ-Poply. אם אתה רואה הודעה זו, המערכת עובדת!'
    };

    await sendEmail(testEmail);
    
    res.json({ 
      success: true, 
      message: 'Test email sent successfully!',
      sentTo: to 
    });
    
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      error: 'Failed to send test email', 
      details: error.message 
    });
  }
});

module.exports = router;
