const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedSmsPackages() {
  try {
    const packages = [
      {
        name: 'חבילת התחלה',
        amount: 100,
        price: 29,
        discount: 0,
        isActive: true,
        isPopular: false
      },
      {
        name: 'חבילה בסיסית',
        amount: 500,
        price: 129,
        discount: 10,
        isActive: true,
        isPopular: true
      },
      {
        name: 'חבילה מקצועית',
        amount: 1000,
        price: 229,
        discount: 15,
        isActive: true,
        isPopular: false
      },
      {
        name: 'חבילה עסקית',
        amount: 2500,
        price: 499,
        discount: 20,
        isActive: true,
        isPopular: false
      },
      {
        name: 'חבילת פרימיום',
        amount: 5000,
        price: 899,
        discount: 25,
        isActive: true,
        isPopular: false
      },
      {
        name: 'חבילת ארגון',
        amount: 10000,
        price: 1599,
        discount: 30,
        isActive: true,
        isPopular: false
      }
    ];

    // מחיקת חבילות קיימות
    await prisma.smsPackageTemplate.deleteMany();

    // יצירת חבילות חדשות
    for (const pkg of packages) {
      await prisma.smsPackageTemplate.create({
        data: pkg
      });
    }

    console.log('✅ חבילות SMS נוצרו בהצלחה!');
    
    const allPackages = await prisma.smsPackageTemplate.findMany({
      orderBy: { amount: 'asc' }
    });
    
    console.log('\nחבילות זמינות:');
    allPackages.forEach(pkg => {
      console.log(`- ${pkg.name}: ${pkg.amount} הודעות במחיר ${pkg.price}₪ (הנחה: ${pkg.discount}%)`);
    });

  } catch (error) {
    console.error('שגיאה ביצירת חבילות:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedSmsPackages();
