// scripts/make-admin.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function makeAdmin(email) {
  if (!email) {
    console.log('使用方法: node scripts/make-admin.js <email>');
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { isAdmin: true },
    });

    console.log(`✅ ${email} を管理者に設定しました`);
    console.log('管理画面: http://localhost:3000/admin');
  } catch (error) {
    if (error.code === 'P2025') {
      console.log(`❌ メールアドレス ${email} のユーザーが見つかりません`);
    } else {
      console.error('エラー:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
makeAdmin(email);