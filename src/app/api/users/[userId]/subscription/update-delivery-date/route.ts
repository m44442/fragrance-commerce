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
    
    // リクエストボディをパース
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      // JSON解析エラーハンドリング
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    
    const { deliveryDate } = body;
    
    if (!deliveryDate) {
      return NextResponse.json({ error: 'deliveryDate is required' }, { status: 400 });
    }
    
    const deliveryDateObj = new Date(deliveryDate);
    
    // 日付のバリデーション
    if (isNaN(deliveryDateObj.getTime())) {
      return NextResponse.json({ error: 'Invalid delivery date' }, { status: 400 });
    }
    
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
    // エラーオブジェクトを安全に扱う
    const errorMessage = error instanceof Error ? error.message : '不明なエラー';
    console.error('Error updating delivery date:', errorMessage);
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 });
  }
}