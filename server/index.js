const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
// Initialize campaign queue and SMS queue
require('./services/campaignQueue');
require('./services/smsQueueService');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware (before any routes)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting (exclude webhooks)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', (req, res, next) => {
  // Skip rate limiting for webhooks
  if (req.path.includes('/webhook')) {
    return next();
  }
  limiter(req, res, next);
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/automations', require('./routes/automations'));
app.use('/api/popups', require('./routes/popups'));
app.use('/api/products', require('./routes/products'));
app.use('/api/events', require('./routes/events'));
app.use('/api/segments', require('./routes/segments'));
app.use('/api/test-email', require('./routes/test-email'));
app.use('/api/email-tracking', require('./routes/email-tracking'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/sms', require('./routes/sms'));
app.use('/api/v1/sms', require('./routes/sms-api'));
app.use('/api/tracking', require('./routes/tracking-stats'));
app.use('/api/sms-packages', require('./routes/sms-packages'));

// Klaviyo-inspired advanced features
app.use('/api/predictive-analytics', require('./routes/predictive-analytics'));
app.use('/api/customer-journey', require('./routes/customer-journey'));
app.use('/api/ab-testing', require('./routes/ab-testing'));
app.use('/api/dynamic-content', require('./routes/dynamic-content'));
app.use('/api/behavioral-triggers', require('./routes/behavioral-triggers'));
app.use('/api/advanced-segmentation', require('./routes/advanced-segmentation'));
app.use('/api/email-templates', require('./routes/email-templates'));

// Webhooks (no authentication required)
app.use('/webhooks', require('./routes/webhooks'));

// Link tracking (public endpoints)
app.use('/l', require('./routes/link-tracking'));

// Unsubscribe (public endpoints)
app.use('/api/unsubscribe', require('./routes/unsubscribe'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📬 Campaign queue initialized and ready`);
  console.log(`📱 SMS queue initialized and ready`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = app;
