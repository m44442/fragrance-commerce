// src/app/api/subscription/[id]/pause/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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
    
    // Stripeでの処理（もしStripeのサブスクリプションIDがある場合）
    if (subscription.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          pause_collection: {
            behavior: 'void',
          },
        });
      } catch (stripeError: any) {
        // Stripeでサブスクリプションが見つからない場合は警告のみ出力
        if (stripeError.code === 'resource_missing') {
          console.warn(`Stripe subscription ${subscription.stripeSubscriptionId} not found, continuing with database update`);
        } else {
          // その他のStripeエラーの場合は再スロー
          throw stripeError;
        }
      }
    }
    
    // データベースを更新
    const updatedSubscription = await prisma.subscription.update({
      where: {
        id: id,
      },
      data: {
        status: 'PAUSED',
      },
    });
    
    return NextResponse.json(updatedSubscription);
  } catch (error) {
    console.error('Error pausing subscription:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}