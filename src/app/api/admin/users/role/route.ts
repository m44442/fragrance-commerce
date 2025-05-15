// src/app/api/admin/users/role/route.ts
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
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 管理者権限チェック
    const adminCheck = await isAdmin(session.user.id);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { userId, makeAdmin } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }
    
    // 自分自身の権限は変更できないようにする
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: '自分自身の権限は変更できません' },
        { status: 400 }
      );
    }
    
    // ユーザーの権限を更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: makeAdmin ? 'ADMIN' : 'USER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
    
    return NextResponse.json({
      user: updatedUser,
      message: `ユーザーの権限を${makeAdmin ? '管理者' : '一般ユーザー'}に変更しました`
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}