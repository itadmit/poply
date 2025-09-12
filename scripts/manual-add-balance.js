const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addManualBalance(email, amount) {
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.log('❌ משתמש לא נמצא');
      return;
    }

    console.log(`👤 משתמש: ${user.email}`);
    console.log(`📊 יתרה נוכחית: ${user.smsBalance}`);

    // עדכון יתרה
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        smsBalance: {
          increment: parseInt(amount)
        }
      }
    });

    // יצירת רשומת חבילה
    await prisma.smsPackage.create({
      data: {
        userId: user.id,
        name: `חבילת ${amount} הודעות SMS (ידני)`,
        amount: parseInt(amount),
        price: 0,
        paymentTransactionId: 'MANUAL-' + Date.now()
      }
    });

    console.log(`✅ היתרה עודכנה בהצלחה!`);
    console.log(`📊 יתרה חדשה: ${updatedUser.smsBalance}`);

  } catch (error) {
    console.error('❌ שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
const amount = process.argv[3];

if (!email || !amount) {
  console.log('Usage: node scripts/manual-add-balance.js <email> <amount>');
  console.log('Example: node scripts/manual-add-balance.js itadmit@gmail.com 500');
  process.exit(1);
}

addManualBalance(email, amount);
