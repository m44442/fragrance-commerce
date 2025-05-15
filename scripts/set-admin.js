// scripts/set-admin.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Email is required. Usage: node scripts/set-admin.js your@email.com');
    process.exit(1);
  }
  
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      process.exit(1);
    }
    
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' }
    });
    
    console.log(`User ${email} is now an admin`);
  } catch (error) {
    console.error('Error setting admin role:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();