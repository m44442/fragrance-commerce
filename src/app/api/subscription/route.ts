// src/app/api/subscription/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';
import { getAtomizerCases } from '@/lib/microcms/client';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

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

// Stripeの料金ID (環境変数から取得)
const STRIPE_PRICE_IDS = {
  MONTHLY: {
    ITEM1: process.env.STRIPE_MONTHLY_ITEM1_PRICE_ID!,
    ITEM2: process.env.STRIPE_MONTHLY_ITEM2_PRICE_ID!,
    ITEM3: process.env.STRIPE_MONTHLY_ITEM3_PRICE_ID!
  },
  ANNUAL: {
    ITEM1: process.env.STRIPE_ANNUAL_ITEM1_PRICE_ID!,
    ITEM2: process.env.STRIPE_ANNUAL_ITEM2_PRICE_ID!,
    ITEM3: process.env.STRIPE_ANNUAL_ITEM3_PRICE_ID!
  }
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const planType = body.planType as keyof typeof STRIPE_PRICE_IDS;
    const itemPlan = body.itemPlan as keyof typeof STRIPE_PRICE_IDS[keyof typeof STRIPE_PRICE_IDS];
    const caseColor = body.caseColor;
    
    // 入力バリデーション
    if (
      !planType ||
      !itemPlan ||
      !['MONTHLY', 'ANNUAL'].includes(planType) ||
      !['ITEM1', 'ITEM2', 'ITEM3'].includes(itemPlan)
    ) {
      return NextResponse.json({ error: 'Invalid plan selection' }, { status: 400 });
    }
    
    // ユーザー情報の取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscriptions: true }
    });
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 既存のアクティブなサブスクリプションをチェック
    const activeSubscription = user.subscriptions.find(sub => 
      sub.status === 'ACTIVE' || sub.status === 'PAUSED'
    );
    
    if (activeSubscription) {
      return NextResponse.json({ 
        error: 'User already has an active subscription',
        subscriptionId: activeSubscription.id 
      }, { status: 400 });
    }
    
    // Stripeで顧客作成（存在しない場合）
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const stripe = getStripe();
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.name || undefined,
        metadata: {
          userId: user.id
        }
      });
      
      stripeCustomerId = customer.id;
      
      // ユーザー情報を更新
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId }
      });
    }
    
    // サブスクリプションプランに基づいた設定
    const subscriptionPlan = planType === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY';
    const priceId = STRIPE_PRICE_IDS[planType][itemPlan];
    const itemCount = parseInt(itemPlan.replace('ITEM', ''));
    
    if (!priceId) {
      return NextResponse.json({ 
        error: 'Price ID not configured for selected plan' 
      }, { status: 400 });
    }
    
    // Stripeサブスクリプションを作成
    const stripe = getStripe();
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      trial_period_days: 30, // 30日間無料トライアル
      metadata: {
        userId: user.id,
        planType,
        itemPlan,
        itemCount: itemCount.toString(),
        caseColor: caseColor || 'BLACK'
      }
    });
    
    // データベースにサブスクリプション情報を保存
    const newSubscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        plan: subscriptionPlan,
        status: 'ACTIVE',
        nextDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
        nextBillingDate: new Date(subscription.current_period_end * 1000),
      }
    });
    
    // アトマイザーケースの名前をmicroCMSから取得
    let caseName = caseColor; // フォールバック
    try {
      const atomizerCases = await getAtomizerCases();
      const selectedCase = atomizerCases.contents?.find((caseItem: any) => caseItem.id === caseColor);
      if (selectedCase) {
        caseName = selectedCase.name;
      }
    } catch (error) {
      console.error('Failed to fetch atomizer case name:', error);
    }
    
    // 初回のアトマイザーケース配送を作成
    await prisma.subscriptionDelivery.create({
      data: {
        subscriptionId: newSubscription.id,
        productName: `初回特典：アトマイザーケース（${caseName}）`,
        status: 'PROCESSING',
        shippingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3日後に発送予定
      }
    });
    
    return NextResponse.json({ 
      subscription: newSubscription,
      stripeSubscriptionId: subscription.id
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}