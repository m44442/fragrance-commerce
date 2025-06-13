// scripts/clear-sessions.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearSessions() {
  try {
    // セッションテーブルをクリア（NextAuthのセッションをリセット）
    const deletedSessions = await prisma.session.deleteMany({});
    console.log(`✅ ${deletedSessions.count} セッションを削除しました`);
    
    // アカウントテーブルは保持（OAuth情報）
    console.log('ℹ️  再ログインしてください');
    
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearSessions();