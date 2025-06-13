import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
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
    
    const { preferCustomSelection } = await request.json();
    
    // サブスクリプションを取得
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
    
    // サブスクリプションの配送設定を更新
    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        preferCustomSelection: preferCustomSelection
      }
    });
    
    // 同じGET APIと同様のレスポンス形式で返す
    const subscriptionData = {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      plan: updatedSubscription.plan,
      planName: updatedSubscription.plan === 'MONTHLY' ? '月額プラン' : '年間プラン',
      preferCustomSelection: updatedSubscription.preferCustomSelection,
      nextDeliveryDate: updatedSubscription.nextDeliveryDate
    };
    
    return NextResponse.json(subscriptionData);
    
  } catch (error) {
    console.error('Error updating delivery preference:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}