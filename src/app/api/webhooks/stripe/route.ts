// src/app/api/webhooks/stripe/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') as string;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }
  
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`Webhook handler failed:`, error);
    return NextResponse.json({ 
      error: 'Webhook handler failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// サブスクリプション作成時の処理
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('No userId in subscription metadata');
    return;
  }
  
  // データベースのサブスクリプション情報を更新
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id
    },
    data: {
      status: 'ACTIVE',
      nextBillingDate: new Date(subscription.current_period_end * 1000),
    }
  });
}

// サブスクリプション更新時の処理
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  let status: 'ACTIVE' | 'PAUSED' | 'CANCELED' = 'ACTIVE';
  
  if (subscription.status === 'canceled') {
    status = 'CANCELED';
  } else if (subscription.pause_collection) {
    status = 'PAUSED';
  }
  
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id
    },
    data: {
      status,
      nextBillingDate: new Date(subscription.current_period_end * 1000),
    }
  });
}

// サブスクリプション削除時の処理
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  await prisma.subscription.updateMany({
    where: {
      stripeSubscriptionId: subscription.id
    },
    data: {
      status: 'CANCELED',
      canceledAt: new Date(),
      endDate: new Date()
    }
  });
}

// 支払い成功時の処理
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log('Invoice paid:', invoice.id);
  
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;
  
  // データベースのサブスクリプション情報を取得
  const dbSubscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId
    }
  });
  
  if (dbSubscription) {
    // 次回配送日を設定（30日後）
    const nextDeliveryDate = new Date();
    nextDeliveryDate.setDate(nextDeliveryDate.getDate() + 30);
    
    await prisma.subscription.update({
      where: {
        id: dbSubscription.id
      },
      data: {
        nextDeliveryDate,
        paymentFailed: false // 支払い成功時にフラグをリセット
      }
    });
    
    // おまかせ配送の場合は自動的に商品を選択
    if (dbSubscription.preferCustomSelection) {
      await createAutoSelectedDelivery(dbSubscription.id);
    }
  }
}

// 支払い失敗時の処理
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Invoice payment failed:', invoice.id);
  
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;
  
  const dbSubscription = await prisma.subscription.findFirst({
    where: {
      stripeSubscriptionId: subscriptionId
    }
  });
  
  if (dbSubscription) {
    await prisma.subscription.update({
      where: {
        id: dbSubscription.id
      },
      data: {
        paymentFailed: true,
        nextBillingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7日後に再試行
      }
    });
  }
}

// 単品決済成功時の処理
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);
  
  const { userId, productId, type } = paymentIntent.metadata;
  
  if (!userId) return;
  
  if (type === 'single_purchase' && productId) {
    // 単品購入の場合、購入履歴を作成
    try {
      await prisma.purchase.create({
        data: {
          userId,
          fragranceId: productId,
        },
      });
      
      // カートから商品を削除（存在する場合）
      const cart = await prisma.cart.findUnique({
        where: { userId }
      });
      
      if (cart) {
        await prisma.cartItem.deleteMany({
          where: {
            cartId: cart.id,
            productId
          }
        });
      }
    } catch (error) {
      console.error('Error creating purchase record:', error);
    }
  } else if (type === 'cart_purchase') {
    // カート購入の場合、すべての商品の購入履歴を作成
    try {
      const cart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: true }
      });
      
      if (cart && cart.items.length > 0) {
        // 購入履歴を作成
        const purchases = cart.items.map(item => ({
          userId,
          fragranceId: item.productId,
        }));
        
        await prisma.purchase.createMany({
          data: purchases,
          skipDuplicates: true
        });
        
        // カートをクリア
        await prisma.cartItem.deleteMany({
          where: { cartId: cart.id }
        });
      }
    } catch (error) {
      console.error('Error processing cart purchase:', error);
    }
  }
}

// おまかせ商品選択処理
async function createAutoSelectedDelivery(subscriptionId: string) {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true }
    });
    
    if (!subscription) return;
    
    // シンプルな商品選択ロジック（実際はより複雑なレコメンデーションシステムを実装）
    const recommendedProducts = await prisma.product.findMany({
      where: {
        isPublished: true,
        stock: { gt: 0 }
      },
      take: 3,
      orderBy: {
        averageRating: 'desc'
      }
    });
    
    if (recommendedProducts.length > 0) {
      const selectedProduct = recommendedProducts[0];
      
      await prisma.subscriptionDelivery.create({
        data: {
          subscriptionId: subscriptionId,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          status: "PROCESSING",
          shippingDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 一週間後に発送予定
          customSelected: false
        }
      });
    }
  } catch (error) {
    console.error('Error creating auto-selected delivery:', error);
  }
}