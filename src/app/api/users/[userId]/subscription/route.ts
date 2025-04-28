import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/lib/next-auth/options";
import prisma from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id || session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // サブスクリプション情報を取得
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: params.userId,
        OR: [
          { status: 'ACTIVE' },
          { status: 'PAUSED' }
        ]
      },
      include: {
        // 支払い方法情報も含める
        user: {
          select: {
            stripeCustomerId: true
          }
        }
      }
    });
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    
    // Stripeから支払い方法情報を取得
    let paymentMethod = null;
    if (subscription.user.stripeCustomerId) {
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
      }
    }
    
    // 配送先住所を取得
    const shippingAddress = await prisma.address.findFirst({
      where: {
        userId: params.userId,
        isDefault: true
      }
    });
    
    // レスポンスデータを整形
    const subscriptionData = {
      id: subscription.id,
      status: subscription.status,
      plan: subscription.plan,
      planName: subscription.plan === 'MONTHLY' ? '月額プラン' : '年間プラン',
      itemCount: parseInt(subscription.stripeSubscriptionId?.split('_')[1] || '1'),
      nextBillingDate: subscription.status === 'ACTIVE' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      nextDeliveryDate: subscription.nextDeliveryDate,
      preferCustomSelection: subscription.preferCustomSelection,
      paymentMethod,
      shippingAddress
    };
    
    return NextResponse.json(subscriptionData);
    
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}