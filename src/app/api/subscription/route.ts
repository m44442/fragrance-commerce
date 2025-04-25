// src/app/api/subscription/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

// Stripeの料金ID (実際の環境で設定)
const STRIPE_PRICE_IDS = {
  MONTHLY: {
    ITEM1: process.env.STRIPE_MONTHLY_ITEM1_PRICE_ID || 'price_monthly_item1',
    ITEM2: process.env.STRIPE_MONTHLY_ITEM2_PRICE_ID || 'price_monthly_item2',
    ITEM3: process.env.STRIPE_MONTHLY_ITEM3_PRICE_ID || 'price_monthly_item3'
  },
  ANNUAL: {
    ITEM1: process.env.STRIPE_ANNUAL_ITEM1_PRICE_ID || 'price_annual_item1',
    ITEM2: process.env.STRIPE_ANNUAL_ITEM2_PRICE_ID || 'price_annual_item2',
    ITEM3: process.env.STRIPE_ANNUAL_ITEM3_PRICE_ID || 'price_annual_item3'
  }
};

export async function POST(request: Request) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { planType, itemPlan, caseColor } = await request.json();
    
    // 入力バリデーション
    if (!planType || !itemPlan || !['MONTHLY', 'ANNUAL'].includes(planType) || 
        !['ITEM1', 'ITEM2', 'ITEM3'].includes(itemPlan)) {
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
    
    // 既存のサブスクリプションをチェック
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
    const subscriptionPlan = (planType === 'ANNUAL') ? 'ANNUAL' : 'MONTHLY';
    const priceId = STRIPE_PRICE_IDS[planType][itemPlan];
    const itemCount = parseInt(itemPlan.replace('ITEM', ''));
    
    // 最初の1ヶ月は無料トライアル
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      trial_period_days: 30,
      metadata: {
        userId: user.id,
        planType,
        itemPlan,
        itemCount: itemCount.toString(),
        caseColor
      }
    });
    
    // データベースにサブスクリプション情報を保存
    const newSubscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        plan: subscriptionPlan as any,
        status: 'ACTIVE',
        nextDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
      }
    });
    
    // 初回のケース選択を保存
    await prisma.subscriptionDelivery.create({
      data: {
        subscriptionId: newSubscription.id,
        productName: `初回特典：アトマイザーケース（${caseColor === 'BLACK' ? 'ブラック' : 'シルバー'}）`,
        status: 'PROCESSING',
        shippingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3日後に発送予定
      }
    });
    
    return NextResponse.json({ 
      subscription: newSubscription,
      checkoutUrl: subscription.latest_invoice?.hosted_invoice_url
    });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}