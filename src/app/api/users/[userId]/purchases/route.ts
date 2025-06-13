// src/app/api/users/[userId]/purchases/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    console.log('=== Fetching purchase history for userId:', userId);
    
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id || session.user.id !== userId) {
      console.log('Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 購入履歴を取得
    const purchases = await prisma.purchase.findMany({
      where: {
        userId: userId,
      },
      include: {
        fragrance: {
          include: {
            brand: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    console.log('Found purchases:', purchases.length);
    
    // レスポンスデータの整形
    const formattedPurchases = purchases.map(purchase => ({
      id: purchase.id,
      createdAt: purchase.createdAt,
      fragranceId: purchase.fragranceId,
      fragrance: {
        id: purchase.fragrance.id,
        title: purchase.fragrance.name,
        brand: purchase.fragrance.brand?.name || '',
        price: purchase.fragrance.price,
        thumbnail: {
          url: purchase.fragrance.thumbnailUrl || '',
        },
      },
    }));
    
    return NextResponse.json({ purchases: formattedPurchases });
  } catch (error) {
    console.error('Error fetching purchase history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}