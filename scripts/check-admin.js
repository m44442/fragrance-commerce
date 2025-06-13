// scripts/check-admin.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdmin() {
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'rikumatsumoto.2003@gmail.com' }
    });

    if (adminUser) {
      console.log('✅ 管理者ユーザーが見つかりました:');
      console.log(`ID: ${adminUser.id}`);
      console.log(`Name: ${adminUser.name}`);
      console.log(`Email: ${adminUser.email}`);
      console.log(`Is Admin: ${adminUser.isAdmin}`);
      console.log(`Role: ${adminUser.role}`);
      console.log(`Has Password: ${!!adminUser.password}`);
      console.log(`Created At: ${adminUser.createdAt}`);
    } else {
      console.log('❌ 管理者ユーザーが見つかりません');
      console.log('初期管理者を作成します...');
      
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('174matsumatsu', 12);
      
      const newAdmin = await prisma.user.create({
        data: {
          email: 'rikumatsumoto.2003@gmail.com',
          name: 'Riku Matsumoto',
          password: hashedPassword,
          isAdmin: true,
          role: 'ADMIN',
          emailVerified: new Date()
        }
      });
      
      console.log('✅ 初期管理者を作成しました:', newAdmin.email);
    }

    // 全管理者を表示
    const allAdmins = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        name: true,
        email: true,
        isAdmin: true,
        role: true,
        createdAt: true
      }
    });

    console.log('\n📋 全管理者一覧:');
    allAdmins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.name}) - ${admin.role}`);
    });

  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdmin();