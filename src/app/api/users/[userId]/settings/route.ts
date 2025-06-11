// src/app/api/users/[userId]/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { name, email, phoneNumber } = await request.json();
    
    // ユーザー情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phoneNumber,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
      },
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user settings:', error);
    
    // メールアドレスの一意性制約違反のエラーを確認
    if (error && typeof error === 'object' && 'code' in error && 
        error.code === 'P2002' && 'meta' in error && 
        error.meta && typeof error.meta === 'object' && 
        'target' in error.meta && Array.isArray(error.meta.target) &&
        error.meta.target.includes('email')) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に使用されています' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}