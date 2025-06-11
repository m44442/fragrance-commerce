import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import prisma from '@/lib/prisma';

// 配送設定の選択肢
enum DeliveryPreference {
  SAME = "same", // 前回と同じアイテム
  FAVORITE = "favorite", // 気になるリストから選択
  RECOMMENDED = "recommended" // カラリア厳選アイテム
}

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
    
    // リクエストボディを取得
    const { preferCustomSelection, deliveryOption } = await request.json();
    
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
    
    // 更新データを準備
    const updateData: any = {
      preferCustomSelection: preferCustomSelection === true
    };
    
    // deliveryOptionが指定されている場合は、選択方式も保存
    if (deliveryOption) {
      updateData.deliveryOption = deliveryOption;
    }
    
    // サブスクリプションの配送設定を更新
    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: subscription.id
      },
      data: updateData
    });
    
    // プラン情報からアイテム数を抽出（もしあれば）
    let itemCount = 1;
    if (subscription.stripeSubscriptionId) {
      const match = subscription.stripeSubscriptionId.match(/ITEM(\d+)/);
      if (match && match[1]) {
        itemCount = parseInt(match[1], 10);
      }
    }
    
    // サブスクリプションからプランタイプとアイテムプランを取得
    const planType = updatedSubscription.plan || 'MONTHLY';
    const itemPlan = `ITEM${itemCount}`;
    
    // プラン名を生成する関数（アイテム数を含む）
    const getPlanDisplayName = (planType: string, itemCount: number): string => {
      // プランタイプの表示名
      const planTypeName = planType === 'MONTHLY' ? '1ヶ月コース' : '年間コース';
      // アイテム数を含むプラン名を返す
      return `${planTypeName} (${itemCount}アイテム)`;
    };
    
    // レスポンス形式で返す
    const subscriptionData = {
      id: updatedSubscription.id,
      status: updatedSubscription.status,
      plan: planType,
      planName: getPlanDisplayName(planType, itemCount),
      itemPlan,
      itemCount,
      nextDeliveryDate: updatedSubscription.nextDeliveryDate,
      preferCustomSelection: updatedSubscription.preferCustomSelection,
      deliveryOption: updatedSubscription.deliveryOption || 'same'
    };
    
    return NextResponse.json(subscriptionData);
    
  } catch (error) {
    console.error('Error updating delivery preference:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}