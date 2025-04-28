import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateCronRequest } from '@/lib/auth/cron';

export async function GET(request: Request) {
  // クロンジョブの認証をチェック
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // 自動選択が有効なアクティブなサブスクリプションを取得
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        preferCustomSelection: false,
        nextDeliveryDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1週間以内に配送予定
        },
      },
      include: {
        user: true,
      },
    });
    
    const results = [];
    
    // 各サブスクリプションに対して商品を選択
    for (const subscription of subscriptions) {
      try {
        // 1. ユーザーの好みを取得（お気に入り、過去の購入履歴など）
        const userFavorites = await prisma.favorite.findMany({
          where: { userId: subscription.userId },
          include: { product: true },
        });
        
        const userPurchases = await prisma.purchase.findMany({
          where: { userId: subscription.userId },
          include: { fragrance: true },
        });
        
        // 2. すでに送っている商品を除外
        const pastDeliveries = await prisma.subscriptionDelivery.findMany({
          where: { subscriptionId: subscription.id },
          orderBy: { createdAt: 'desc' },
          take: 5, // 直近5回分を確認
        });
        
        const pastProductIds = pastDeliveries
          .filter(d => d.productId)
          .map(d => d.productId);
        
        // 3. おすすめ商品の選定方法
        let selectedProducts;
        
        // お気に入りに登録されている商品があれば、そこから選ぶ
        if (userFavorites.length > 0) {
          selectedProducts = userFavorites
            .filter(fav => !pastProductIds.includes(fav.productId))
            .map(fav => fav.product)
            .slice(0, 3); // 最大3つまで
        }
        
        // お気に入りが無い場合や足りない場合は、人気商品から選択
        if (!selectedProducts || selectedProducts.length < 3) {
          const popularProducts = await prisma.product.findMany({
            where: {
              id: { notIn: [...pastProductIds, ...(selectedProducts?.map(p => p.id) || [])] },
              isPublished: true,
            },
            orderBy: {
              reviewCount: 'desc',
            },
            take: 3 - (selectedProducts?.length || 0),
          });
          
          selectedProducts = [...(selectedProducts || []), ...popularProducts];
        }
        
        // 4. 商品をランダムに１つ選ぶ（もしくは複数）
        const itemCount = getSubscriptionItemCount(subscription.plan);
        const finalSelectedProducts = selectedProducts.slice(0, itemCount);
        
        // 5. 配送情報を作成
        for (const product of finalSelectedProducts) {
          await prisma.subscriptionDelivery.create({
            data: {
              subscriptionId: subscription.id,
              productId: product.id,
              productName: product.name,
              status: 'PROCESSING',
              shippingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3日後に発送予定
              customSelected: false, // 自動選択
            },
          });
        }
        
        results.push({
          userId: subscription.userId,
          email: subscription.user.email,
          selectedProducts: finalSelectedProducts.map(p => p.name),
          success: true,
        });
      } catch (subError) {
        console.error(`Error processing subscription ${subscription.id}:`, subError);
        results.push({
          userId: subscription.userId,
          email: subscription.user.email,
          error: subError.message,
          success: false,
        });
      }
    }
    
    return NextResponse.json({
      processed: subscriptions.length,
      results,
    });
  } catch (error) {
    console.error('Error in auto-select-fragrances:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// サブスクリプションプランに応じたアイテム数を取得
function getSubscriptionItemCount(plan: string): number {
  // サブスクリプションプランのIDからアイテム数を解析
  const match = plan.match(/ITEM(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  return 1; // デフォルトは1アイテム
}