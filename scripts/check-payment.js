const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPaymentAndBalance(userEmail) {
  try {
    // מצא את המשתמש
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        smsPackages: {
          orderBy: { purchasedAt: 'desc' },
          take: 5
        }
      }
    });

    if (!user) {
      console.log('❌ משתמש לא נמצא');
      return;
    }

    console.log('\n👤 פרטי משתמש:');
    console.log(`   אימייל: ${user.email}`);
    console.log(`   שם: ${user.firstName} ${user.lastName}`);
    console.log(`   יתרת SMS: ${user.smsBalance}`);
    console.log(`   ID: ${user.id}`);

    if (user.smsPackages.length > 0) {
      console.log('\n📦 רכישות אחרונות:');
      user.smsPackages.forEach((pkg, index) => {
        console.log(`\n   ${index + 1}. ${pkg.name}`);
        console.log(`      כמות: ${pkg.amount}`);
        console.log(`      מחיר: ₪${pkg.price}`);
        console.log(`      תאריך: ${pkg.purchasedAt.toLocaleString('he-IL')}`);
        console.log(`      Transaction ID: ${pkg.paymentTransactionId || 'לא זמין'}`);
      });
    } else {
      console.log('\n📦 אין רכישות עדיין');
    }

    // בדוק חבילות זמינות
    const templates = await prisma.smsPackageTemplate.findMany({
      where: { isActive: true },
      orderBy: { amount: 'asc' }
    });

    console.log('\n📋 חבילות זמינות:');
    templates.forEach(t => {
      const finalPrice = t.discount > 0 
        ? Math.round(t.price * (1 - t.discount / 100) * 100) / 100
        : t.price;
      console.log(`   - ${t.name}: ${t.amount} הודעות במחיר ₪${finalPrice} (מחיר מקורי: ₪${t.price}, הנחה: ${t.discount}%)`);
    });

  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// קבל אימייל מהפרמטר או השתמש בברירת מחדל
const email = process.argv[2] || 'itadmit@gmail.com';
checkPaymentAndBalance(email);
