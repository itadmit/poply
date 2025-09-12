const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany();
    console.log(`מספר משתמשים במערכת: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\nרשימת משתמשים:');
      users.forEach(user => {
        console.log(`- ${user.email} (${user.firstName} ${user.lastName})`);
      });
    } else {
      console.log('\nאין משתמשים במערכת. צור משתמש חדש עם:');
      console.log('node scripts/create-admin.js');
    }
  } catch (error) {
    console.error('שגיאה:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
