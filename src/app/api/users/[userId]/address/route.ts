// src/app/api/users/[userId]/address/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id || session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { postalCode, prefecture, city, address } = await request.json();
    
    // 住所情報を更新
    const updatedUser = await prisma.user.update({
      where: { id: params.userId },
      data: {
        postalCode,
        prefecture,
        city,
        address,
      },
      select: {
        id: true,
        postalCode: true,
        prefecture: true,
        city: true,
        address: true,
      },
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}