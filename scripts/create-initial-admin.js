// scripts/create-initial-admin.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createInitialAdmin() {
  const email = 'rikumatsumoto.2003@gmail.com';
  const password = '174matsumatsu';
  const name = 'Riku Matsumoto';

  try {
    // 既存ユーザーをチェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // 既存ユーザーを管理者に昇格
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { 
          isAdmin: true,
          role: 'ADMIN'
        }
      });
      console.log(`✅ 既存ユーザー ${email} を管理者に昇格しました`);
      return;
    }

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 12);

    // 初期管理者ユーザーを作成
    const admin = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        isAdmin: true,
        role: 'ADMIN',
        emailVerified: new Date() // 管理者は即座に認証済みとする
      }
    });

    console.log(`✅ 初期管理者ユーザーを作成しました`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`🌐 管理画面: http://localhost:3000/admin`);
    console.log(`⚠️  セキュリティのため、初回ログイン後にパスワードを変更してください`);
    
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createInitialAdmin();