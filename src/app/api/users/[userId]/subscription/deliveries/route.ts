import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import prisma from '@/lib/prisma';

export async function GET(
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
    
    // アクティブか一時停止中のサブスクリプションを取得
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        OR: [
          { status: 'ACTIVE' },
          { status: 'PAUSED' }
        ]
      }
    });
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    
    // 配送履歴を取得
    const deliveries = await prisma.subscriptionDelivery.findMany({
      where: {
        subscriptionId: subscription.id
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(deliveries);
    
  } catch (error) {
    console.error('Error fetching delivery history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}