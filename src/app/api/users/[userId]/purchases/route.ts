// src/app/api/users/[userId]/purchases/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id || session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 購入履歴を取得
    const purchases = await prisma.purchase.findMany({
      where: {
        userId: params.userId,
      },
      include: {
        fragrance: {
          select: {
            id: true,
            name: true,
            brand: {
              select: {
                name: true,
              },
            },
            price: true,
            thumbnailUrl: true,
            microCmsId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // レスポンスデータの整形
    const formattedPurchases = purchases.map(purchase => ({
      id: purchase.id,
      createdAt: purchase.createdAt,
      fragranceId: purchase.fragranceId,
      fragrance: {
        id: purchase.fragrance.id,
        title: purchase.fragrance?.name,
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