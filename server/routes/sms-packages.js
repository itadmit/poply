const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken } = require('../middleware/auth');
const payPlusService = require('../services/payPlusService');
const { v4: uuidv4 } = require('uuid');

// קבלת רשימת חבילות זמינות
router.get('/available', authenticateToken, async (req, res) => {
  try {
    const packages = await prisma.smsPackageTemplate.findMany({
      where: { isActive: true },
      orderBy: { amount: 'asc' }
    });

    // חישוב מחיר להודעה
    const packagesWithPricePerSms = packages.map(pkg => ({
      ...pkg,
      pricePerSms: (pkg.price / pkg.amount).toFixed(3),
      finalPrice: pkg.discount > 0 
        ? Math.round(pkg.price * (1 - pkg.discount / 100) * 100) / 100
        : pkg.price
    }));

    res.json(packagesWithPricePerSms);
  } catch (error) {
    console.error('Error fetching SMS packages:', error);
    res.status(500).json({ error: 'שגיאה בטעינת חבילות' });
  }
});

// יצירת הזמנה לרכישת חבילה
router.post('/purchase', authenticateToken, async (req, res) => {
  try {
    const { packageId } = req.body;
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }

    // מציאת החבילה
    const packageTemplate = await prisma.smsPackageTemplate.findUnique({
      where: { id: packageId }
    });

    if (!packageTemplate || !packageTemplate.isActive) {
      return res.status(404).json({ error: 'חבילה לא נמצאה' });
    }

    // חישוב מחיר סופי - עיגול לשתי ספרות אחרי הנקודה
    const finalPrice = packageTemplate.discount > 0 
      ? Math.round(packageTemplate.price * (1 - packageTemplate.discount / 100) * 100) / 100
      : packageTemplate.price;

    // יצירת מזהה הזמנה ייחודי
    const orderId = `SMS-${Date.now()}-${uuidv4().substring(0, 8)}`;

    // URLs לחזרה מ-PayPlus
    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const successUrl = `${baseUrl}/sms/purchase-success?orderId=${orderId}`;
    const failureUrl = `${baseUrl}/sms/purchase-failed?orderId=${orderId}`;
    const callbackUrl = `${process.env.API_URL || 'http://localhost:3001'}/api/sms-packages/callback`;

    // יצירת קישור תשלום ב-PayPlus
    const paymentResult = await payPlusService.createPaymentLink({
      amount: finalPrice,
      customerName: `${user.firstName} ${user.lastName}`,
      customerEmail: user.email,
      customerPhone: user.phone || '',
      productName: packageTemplate.name,
      orderId: orderId,
      successUrl,
      failureUrl,
      callbackUrl,
      moreInfo: {
        userId: user.id,
        packageId: packageTemplate.id,
        smsAmount: packageTemplate.amount.toString()
      }
    });

    if (!paymentResult.success) {
      return res.status(500).json({ error: 'שגיאה ביצירת קישור תשלום' });
    }

    res.json({
      success: true,
      paymentLink: paymentResult.paymentLink,
      orderId: orderId
    });

  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({ error: 'שגיאה ביצירת הזמנה' });
  }
});

// Webhook לקבלת אישור תשלום מ-PayPlus
router.post('/callback', async (req, res) => {
  try {
    console.log('PayPlus callback received:', req.body);
    console.log('Headers:', req.headers);

    // עיבוד ה-callback
    const result = await payPlusService.processCallback(req.body, req.headers);

    if (result.success) {
      console.log('Payment processed successfully:', result);
      res.status(200).json({ status: 'ok' });
    } else {
      console.error('Payment processing failed:', result);
      res.status(200).json({ status: 'failed', error: result.error });
    }
  } catch (error) {
    console.error('Error processing PayPlus callback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// קבלת היסטוריית רכישות
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const packages = await prisma.smsPackage.findMany({
      where: { userId: req.user.id },
      orderBy: { purchasedAt: 'desc' }
    });

    res.json(packages);
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    res.status(500).json({ error: 'שגיאה בטעינת היסטוריית רכישות' });
  }
});

// בדיקת סטטוס הזמנה
router.get('/order-status/:orderId', authenticateToken, async (req, res) => {
  try {
    const { orderId } = req.params;

    // חיפוש החבילה לפי orderId (שמור ב-more_info)
    const smsPackage = await prisma.smsPackage.findFirst({
      where: {
        userId: req.user.id,
        paymentTransactionId: {
          contains: orderId
        }
      }
    });

    if (smsPackage) {
      res.json({
        status: 'completed',
        package: smsPackage
      });
    } else {
      res.json({
        status: 'pending'
      });
    }
  } catch (error) {
    console.error('Error checking order status:', error);
    res.status(500).json({ error: 'שגיאה בבדיקת סטטוס הזמנה' });
  }
});

// הוספת חבילה ידנית (לאדמין בלבד)
router.post('/add-manual', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'אין הרשאה' });
    }

    const { userId, amount, price, name } = req.body;

    if (!userId || !amount || !name) {
      return res.status(400).json({ error: 'חסרים פרטים' });
    }

    // בדיקה שהמשתמש קיים
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }

    // הוספת החבילה
    const smsPackage = await prisma.smsPackage.create({
      data: {
        userId,
        name,
        amount,
        price: price || 0,
        paymentTransactionId: 'MANUAL-' + Date.now()
      }
    });

    // עדכון יתרת SMS
    await prisma.user.update({
      where: { id: userId },
      data: {
        smsBalance: {
          increment: amount
        }
      }
    });

    res.json({
      success: true,
      package: smsPackage,
      newBalance: user.smsBalance + amount
    });

  } catch (error) {
    console.error('Error adding manual package:', error);
    res.status(500).json({ error: 'שגיאה בהוספת חבילה' });
  }
});

module.exports = router;
