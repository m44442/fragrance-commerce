import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id || session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { deliveryDate } = await request.json();
    const deliveryDateObj = new Date(deliveryDate);
    
    // サブスクリプションを取得
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: params.userId,
        OR: [
          { status: 'ACTIVE' },
          { status: 'PAUSED' }
        ]
      }
    });
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    
    // サブスクリプションの配送日を更新
    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: subscription.id
      },
      data: {
        nextDeliveryDate: deliveryDateObj,
        // 手動選択の場合はpreferCustomSelectionをfalseに
        preferCustomSelection: false
      }
    });
    
    // レスポンス形式で返す
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
    console.error('Error updating delivery date:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}