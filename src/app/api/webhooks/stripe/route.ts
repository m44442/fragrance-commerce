// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();
  
  if (!sig) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
  }
  
  try {
    // WebhookイベントをStripeで検証
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    
    // イベントタイプに基づいて処理
    switch (event.type) {
      // サブスクリプション開始時の処理
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
        
      // サブスクリプション更新時の処理
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      // サブスクリプション解約時の処理
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      // 支払い成功時の処理
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
        
      // 支払い失敗時の処理
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}

// サブスクリプション作成時の処理
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata.userId;
  if (!userId) return;
  
  // プラン情報を取得
  const planType = subscription.metadata.planType || 'ANNUAL';
  const itemPlan = subscription.metadata.itemPlan || 'ITEM1';
  const itemCount = parseInt(subscription.metadata.itemCount || '1');
  
  // 既存のサブスクリプションを確認
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscription.id,
    },
  });
  
  if (existingSubscription) return;
  
  // データベースに新しいサブスクリプションを登録
  const newSubscription = await prisma.subscription.create({
    data: {
      userId,
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId: subscription.id,
      plan: planType === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY',
      status: 'ACTIVE',
      nextDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
    },
  });

  // 初回のケース選択を保存
  if (subscription.metadata.caseColor) {
    await prisma.subscriptionDelivery.create({
      data: {
        subscriptionId: newSubscription.id,
        productName: `初回特典：アトマイザーケース（${subscription.metadata.caseColor === 'BLACK' ? 'ブラック' : 'シルバー'}）`,
        status: 'PROCESSING',
        shippingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3日後に発送予定
      },
    });
  }
}

// サブスクリプション更新時の処理
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // ステータスに基づいて更新
  let status: 'ACTIVE' | 'PAUSED' | 'CANCELED' | 'EXPIRED';

  switch (subscription.status) {
    case 'active':
      status = 'ACTIVE';
      break;
    case 'paused':
      status = 'PAUSED';
      break;
    case 'canceled':
      status = 'CANCELED';
      break;
    default:
      status = 'EXPIRED';
  }

  // サブスクリプション情報を更新
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status,
      // 次回請求日がある場合は更新
      ...(subscription.current_period_end ? {
        nextDeliveryDate: new Date(subscription.current_period_end * 1000),
      } : {}),
      // キャンセル日がある場合は更新
      ...(subscription.canceled_at ? {
        canceledAt: new Date(subscription.canceled_at * 1000),
      } : {}),
    },
  });
}

// サブスクリプション削除時の処理
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id,
    },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      endDate: new Date(),
    },
  });
}

// 支払い成功時の処理
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  // サブスクリプション情報を取得
  const subscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: invoice.subscription as string,
    },
  });

  if (!subscription) return;

  // アイテム数を取得
  const stripeSubscription = await stripe.subscriptions.retrieve(
    invoice.subscription as string
  );
  
  const itemCount = parseInt(stripeSubscription.metadata.itemCount || '1');
  
  // 次回の香水サンプル配送を予約（アイテム数に応じて）
  const deliveryPromises = [];
  for (let i = 0; i < itemCount; i++) {
    deliveryPromises.push(
      prisma.subscriptionDelivery.create({
        data: {
          subscriptionId: subscription.id,
          productName: `今月のおすすめ香水サンプル ${i + 1}`,
          status: 'PROCESSING',
          shippingDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3日後に発送予定
        },
      })
    );
  }
  
  // 全ての配送を作成
  await Promise.all(deliveryPromises);

  // 次回配送日を更新
  await prisma.subscription.update({
    where: {
      id: subscription.id,
    },
    data: {
      nextDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日後
    },
  });
}

// 支払い失敗時の処理
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  // 失敗回数に応じた処理
  if (invoice.attempt_count && invoice.attempt_count > 3) {
    // 3回以上失敗した場合はサブスクリプションを一時停止
    await prisma.subscription.updateMany({
      where: {
        stripeSubscriptionId: invoice.subscription as string,
      },
      data: {
        status: 'PAUSED',
      },
    });
  }
}