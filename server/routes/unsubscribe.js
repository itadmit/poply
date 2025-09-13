const express = require('express');
const unsubscribeService = require('../services/unsubscribeService');

const router = express.Router();

// קבלת פרטי טוקן הסרה
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const tokenDetails = await unsubscribeService.getTokenDetails(token);
    
    res.json({
      success: true,
      data: tokenDetails
    });
  } catch (error) {
    console.error('Error getting token details:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// הסרה מדיוור
router.post('/:token/unsubscribe', async (req, res) => {
  try {
    const { token } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await unsubscribeService.unsubscribeContact(token, ipAddress, userAgent);
    
    res.json({
      success: true,
      message: 'הוסרת בהצלחה מרשימת הדיוור',
      data: result
    });
  } catch (error) {
    console.error('Error unsubscribing contact:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// הרשמה מחדש לדיוור
router.post('/:token/resubscribe', async (req, res) => {
  try {
    const { token } = req.params;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    
    const result = await unsubscribeService.resubscribeContact(token, ipAddress, userAgent);
    
    res.json({
      success: true,
      message: 'נרשמת מחדש בהצלחה לקבלת דיוור',
      data: result
    });
  } catch (error) {
    console.error('Error resubscribing contact:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// בדיקת סטטוס הסרה של איש קשר
router.get('/status/:contactId/:messageType?', async (req, res) => {
  try {
    const { contactId, messageType = 'BOTH' } = req.params;
    const status = await unsubscribeService.getUnsubscribeStatus(contactId, messageType);
    
    res.json({
      success: true,
      unsubscribed: status
    });
  } catch (error) {
    console.error('Error checking unsubscribe status:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 