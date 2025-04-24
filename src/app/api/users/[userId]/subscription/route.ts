// src/app/api/users/[userId]/subscription/route.ts
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
    
    // サブスクリプション情報を取得
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: params.userId,
        OR: [
          { status: 'ACTIVE' },
          { status: 'PAUSED' },
          { 
            AND: [
              { status: 'CANCELED' },
              { endDate: { gt: new Date() } },
            ],
          },
        ],
      },
    });
    
    if (!subscription) {
      return NextResponse.json({ subscription: null, deliveries: [] });
    }
    
    // 配送履歴を取得
    const deliveries = await prisma.subscriptionDelivery.findMany({
      where: {
        subscriptionId: subscription.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    return NextResponse.json({ subscription, deliveries });
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}