import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // サブスクリプション情報を取得
    const subscription = await prisma.subscription.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    
    if (subscription.status !== 'PAUSED') {
      return NextResponse.json({ error: 'Subscription is not paused' }, { status: 400 });
    }
    
    // Stripeでの処理（もしStripeのサブスクリプションIDがある場合）
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        pause_collection: '',
      });
    }
    
    // データベースを更新
    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: params.id,
      },
      data: {
        status: 'ACTIVE',
        nextDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
      },
    });
    
    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}