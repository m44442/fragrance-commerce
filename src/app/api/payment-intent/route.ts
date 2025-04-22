// src/app/api/payment-intent/route.ts
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';

// Stripeクライアントの初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { productId, amount } = await request.json();
    
    // PaymentIntent作成
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'jpy',
      metadata: {
        productId,
        userId: session.user.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    return NextResponse.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}