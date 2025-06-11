import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import prisma from '@/lib/prisma';

// プラン料金の定義
const PLAN_PRICES = {
  MONTHLY: {
    ITEM1: 2390,
    ITEM2: 3990,
    ITEM3: 5490
  },
  ANNUAL: {
    ITEM1: 1990,
    ITEM2: 3580,
    ITEM3: 4770
  }
};

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
    
    // サブスクリプション情報を取得
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        OR: [
          { status: 'ACTIVE' },
          { status: 'PAUSED' }
        ]
      },
      include: {
        // ユーザー情報も含める
        user: {
          select: {
            stripeCustomerId: true,
            postalCode: true,
            prefecture: true,
            city: true,
            address: true,
            name: true,
          }
        },
        // 配送情報も含める
        deliveries: {
          where: {
            status: {
              in: ['PENDING', 'PROCESSING']
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 3 // 直近の3件
        }
      }
    });
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    
    // Stripeから支払い方法情報を取得
    let paymentMethod = null;
    if (subscription.user.stripeCustomerId) {
      try {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        
        // 顧客のデフォルト支払い方法を取得
        const customer = await stripe.customers.retrieve(
          subscription.user.stripeCustomerId,
          { expand: ['default_source'] }
        );
        
        if (customer.default_source) {
          paymentMethod = {
            brand: customer.default_source.brand,
            last4: customer.default_source.last4,
            expMonth: customer.default_source.exp_month,
            expYear: customer.default_source.exp_year
          };
        } else if (customer.invoice_settings?.default_payment_method) {
          // 新しいStripe APIでは default_payment_method も確認
          const paymentMethodId = customer.invoice_settings.default_payment_method;
          const paymentMethodDetails = await stripe.paymentMethods.retrieve(paymentMethodId);
          
          if (paymentMethodDetails) {
            paymentMethod = {
              brand: paymentMethodDetails.card?.brand || 'unknown',
              last4: paymentMethodDetails.card?.last4 || '****',
              expMonth: paymentMethodDetails.card?.exp_month || '**',
              expYear: paymentMethodDetails.card?.exp_year || '**'
            };
          }
        }
      } catch (stripeError) {
        console.error('Stripe API error:', stripeError);
        // Stripeエラーはログに記録するが、続行する
      }
    }
    
    // ユーザー情報から配送先住所を取得
    const shippingAddress = {
      postalCode: subscription.user.postalCode || '',
      prefecture: subscription.user.prefecture || '',
      city: subscription.user.city || '',
      address: subscription.user.address || '',
      name: subscription.user.name || '',
    };
    
    // 次回の配送予定商品を取得
    const upcomingDeliveries = subscription.deliveries.map(delivery => ({
      id: delivery.id,
      productId: delivery.productId,
      productName: delivery.productName,
      status: delivery.status,
      shippingDate: delivery.shippingDate,
      customSelected: delivery.customSelected
    }));
    
    // プラン情報からアイテム数を抽出（もしあれば）
    let itemCount = 1;
    if (subscription.stripeSubscriptionId) {
      const match = subscription.stripeSubscriptionId.match(/ITEM(\d+)/);
      if (match && match[1]) {
        itemCount = parseInt(match[1], 10);
      }
    }
    
    // 次回請求日（概算）
    const nextBillingDate = subscription.nextBillingDate || 
      (subscription.status === 'ACTIVE' ? 
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null);
    
    // サブスクリプションからプランタイプとアイテムプランを取得
    const planType = subscription.plan || 'MONTHLY';
    const itemPlan = `ITEM${itemCount}`;

    // 料金を取得
    const price = getSubscriptionPrice(planType, itemPlan);

    // アイテム数を含むプラン名を生成
    const planDisplayName = getPlanDisplayName(planType, itemCount);
    
    // レスポンスデータを整形
    const subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      plan: planType,
      planName: planDisplayName, // アイテム数を含むプラン名
      itemPlan: itemPlan,
      itemCount: itemCount,
      price: price,
      nextBillingDate: nextBillingDate,
      nextDeliveryDate: subscription.nextDeliveryDate,
      preferCustomSelection: subscription.preferCustomSelection,
      paymentMethod,
      shippingAddress,
      upcomingDeliveries
    };
    
    return NextResponse.json(subscriptionData);
    
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// プラン料金を取得する関数
function getSubscriptionPrice(planType: string, itemPlan: string): number {
  // デフォルト値の設定
  const defaultPlanType = 'MONTHLY';
  const defaultItemPlan = 'ITEM1';
  
  // プランタイプとアイテムプランの検証
  const validPlanType = ['MONTHLY', 'ANNUAL'].includes(planType) ? planType : defaultPlanType;
  const validItemPlan = ['ITEM1', 'ITEM2', 'ITEM3'].includes(itemPlan) ? itemPlan : defaultItemPlan;
  
  // 料金を返す
  return PLAN_PRICES[validPlanType as keyof typeof PLAN_PRICES][validItemPlan as keyof typeof PLAN_PRICES.MONTHLY] || PLAN_PRICES[defaultPlanType as keyof typeof PLAN_PRICES][defaultItemPlan as keyof typeof PLAN_PRICES.MONTHLY];
}

// プラン名を生成する関数（アイテム数を含む）
function getPlanDisplayName(planType: string, itemCount: number): string {
  // プランタイプの表示名
  const planTypeName = planType === 'MONTHLY' ? '1ヶ月コース' : '12ヶ月コース';
  
  // アイテム数を含むプラン名を返す
  return `${planTypeName} (${itemCount}アイテム)`;
}