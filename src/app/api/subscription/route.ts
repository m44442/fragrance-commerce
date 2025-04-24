// src/app/api/subscription/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { plan, caseColor } = await request.json();
    
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
    
    // 価格IDを決定（プランに基づく）
    let priceId;
    switch (plan) {
      case 'MONTHLY':
        priceId = process.env.STRIPE_MONTHLY_PRICE_ID;
        break;
      case 'QUARTERLY':
        priceId = process.env.STRIPE_QUARTERLY_PRICE_ID;
        break;
      case 'BIANNUAL':
        priceId = process.env.STRIPE_BIANNUAL_PRICE_ID;
        break;
      case 'ANNUAL':
        priceId = process.env.STRIPE_ANNUAL_PRICE_ID;
        break;
      default:
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }
    
    // 最初の1ヶ月は無料トライアル
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      trial_period_days: 30,
      metadata: {
        userId: user.id,
        plan,
        caseColor  // 選択したケースの色を保存
      }
    });
    
    // データベースにサブスクリプション情報を保存
    const newSubscription = await prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        plan: plan as any,
        status: 'ACTIVE',
        nextDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
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