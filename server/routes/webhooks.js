const express = require('express');
const router = express.Router();
const smsQueueService = require('../services/smsQueueService');

// SMS status webhook from SMS4FREE
router.get('/sms/status', async (req, res) => {
  try {
    const { to, status } = req.query;

    console.log('SMS Status Webhook received:', { to, status });

    if (!to || !status) {
      return res.status(400).send('Missing parameters');
    }

    await smsQueueService.updateSmsStatus(to, parseInt(status));
    
    // Return 200 OK immediately
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling SMS status webhook:', error);
    // Still return 200 to prevent retries
    res.status(200).send('OK');
  }
});

// POST version for SMS status webhook (in case SMS4FREE sends POST)
router.post('/sms/status', async (req, res) => {
  try {
    const { to, status } = req.body || req.query;

    console.log('SMS Status Webhook received (POST):', { to, status });

    if (!to || !status) {
      return res.status(400).send('Missing parameters');
    }

    await smsQueueService.updateSmsStatus(to, parseInt(status));
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling SMS status webhook:', error);
    res.status(200).send('OK');
  }
});

module.exports = router;
