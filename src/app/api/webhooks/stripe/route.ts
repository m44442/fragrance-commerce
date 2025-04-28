import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') as string;
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }
  
  // イベントに基づいた処理
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Webhook handler failed:`, error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

// サブスクリプション作成時の処理
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // 既に実装されているコードが適正に動作していることを前提に追記
  
  // 30日後にお届けする商品をスケジュールする処理の追加
  const userId = subscription.metadata.userId;
  if (!userId) return;
  
  // サブスクリプション情報を取得
  const dbSubscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscription.id
    }
  });
  
  if (dbSubscription) {
    // 次回の配送をスケジュール
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    
    await prisma.subscription.update({
      where: {
        id: dbSubscription.id
      },
      data: {
        nextDeliveryDate: nextMonth
      }
    });
  }
}

// サブスクリプション更新時の処理
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // 既存のコードに追記

  // 支払いに関する情報更新が必要な場合の処理
}

// 支払い成功時の処理
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const subscription = invoice.subscription as string;
  if (!subscription) return;
  
  // DBのサブスクリプション情報を更新
  const dbSubscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscription
    }
  });
  
  if (dbSubscription) {
    // 請求処理が成功したら新しい配送をスケジュールする
    const nextDeliveryDate = new Date();
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 30); // 30日後
    
    if (dbSubscription.preferCustomSelection) {
      // おまかせ配送の場合は自動的に商品を選択してお届け予定を作成
      await createAutoSelectedDelivery(dbSubscription.id);
    } else {
      // 手動選択の場合は次回の配送日だけ更新
      await prisma.subscription.update({
        where: {
          id: dbSubscription.id
        },
        data: {
          nextDeliveryDate
        }
      });
    }
  }
}

// おまかせ商品選択処理
async function createAutoSelectedDelivery(subscriptionId: string) {
  // サブスクリプション情報を取得
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { user: true }
  });
  
  if (!subscription) return;
  
  // ユーザーの好みや購入履歴に基づいて商品を選択
  // 実際のロジックは別途実装が必要
  
  // お届けレコードを作成
  await prisma.subscriptionDelivery.create({
    data: {
      subscriptionId: subscriptionId,
      productName: "おすすめの香水", // 実際は選択ロジックで決定
      status: "PROCESSING",
      shippingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 一週間後に発送予定
      customSelected: false
    }
  });
  
  // サブスクリプションの次回お届け日を更新
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      nextDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30日後
    }
  });
}