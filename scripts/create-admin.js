const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@poply.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN'
      }
    });
    
    console.log('✅ משתמש אדמין נוצר בהצלחה!');
    console.log('📧 אימייל: admin@poply.com');
    console.log('🔑 סיסמה: admin123');
    console.log('👤 שם: Admin User');
    
  } catch (error) {
    console.error('❌ שגיאה ביצירת משתמש:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
