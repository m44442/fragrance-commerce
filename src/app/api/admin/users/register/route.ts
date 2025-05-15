// src/app/api/admin/users/register/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

// 管理者かどうかチェックする関数
async function isAdmin(userId: string) {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user?.role === 'ADMIN';
}

export async function POST(request: Request) {
  try {
    // ユーザー数を確認
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });
    
    // 最初のユーザーまたは管理者がいない場合は認証チェックをスキップ
    if (userCount === 0 || adminCount === 0) {
      console.log('初回管理者登録: 認証チェックをスキップします');
    } else {
      // それ以外は通常の認証チェック
      const session = await getServerSession(nextAuthOptions);
      
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      // 管理者権限チェック
      const adminCheck = await isAdmin(session.user.id);
      if (!adminCheck) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }
    
    const { email, name } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // 既存ユーザーをチェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      // 既存ユーザーを管理者に更新
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: 'ADMIN' }
      });
      
      return NextResponse.json({
        user: updatedUser,
        message: `既存ユーザー ${email} を管理者に設定しました`
      });
    } else {
      // 新しい管理者ユーザーを作成
      const newUser = await prisma.user.create({
        data: {
          email,
          name: name || 'Admin User',
          role: 'ADMIN',
          emailVerified: new Date()
        }
      });
      
      return NextResponse.json({
        user: newUser,
        message: `新しい管理者ユーザー ${email} を作成しました`
      });
    }
  } catch (error) {
    console.error('Error registering admin user:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}