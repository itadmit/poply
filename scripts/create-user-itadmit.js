const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createUser() {
  try {
    const hashedPassword = await bcrypt.hash('115599', 10);
    
    const user = await prisma.user.create({
      data: {
        email: 'itadmit@gmail.com',
        password: hashedPassword,
        firstName: 'יוגב',
        lastName: 'תדמית',
        company: 'תדמית אינטראקטיב',
        role: 'ADMIN'
      }
    });

    console.log('✅ משתמש נוצר בהצלחה!');
    console.log('📧 אימייל: itadmit@gmail.com');
    console.log('🔑 סיסמה: 115599');
    console.log('👤 שם: יוגב תדמית');
    console.log('🏢 חברה: תדמית אינטראקטיב');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('❌ המשתמש כבר קיים במערכת');
    } else {
      console.error('שגיאה ביצירת משתמש:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
