// src/app/api/subscription/[id]/update-plan/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Stripeの料金ID
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { planType, itemPlan } = await request.json();
    
    // 入力バリデーション
    if (!planType || !itemPlan || !['MONTHLY', 'ANNUAL'].includes(planType) || 
        !['ITEM1', 'ITEM2', 'ITEM3'].includes(itemPlan)) {
      return NextResponse.json({ error: 'Invalid plan selection' }, { status: 400 });
    }
    
    // サブスクリプション情報を取得
    const subscription = await prisma.subscription.findUnique({
      where: {
        id: id,
        userId: session.user.id,
      },
    });
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    
    if (subscription.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 });
    }
    
    // サブスクリプションプランに基づいた設定
    const subscriptionPlan = (planType === 'ANNUAL') ? 'ANNUAL' : 'MONTHLY';
    const priceId = STRIPE_PRICE_IDS[planType][itemPlan];
    
    // Stripeのサブスクリプションを更新
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        items: [
          {
            id: subscription.stripeSubscriptionId, // 実際にはサブスクリプションアイテムIDが必要
            price: priceId,
          },
        ],
        metadata: {
          ...subscription,
          planType,
          itemPlan,
        },
      });
    }
    
    // データベースを更新
    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: id,
      },
      data: {
        plan: subscriptionPlan as any,
        // その他の必要なフィールドを更新
      },
    });
    
    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}