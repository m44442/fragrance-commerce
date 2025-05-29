// src/app/api/setup-intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    
    // Stripe顧客IDがない場合は作成
    let stripeCustomerId = user?.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user?.email || undefined,
        name: user?.name || undefined,
        metadata: {
          userId: user?.id
        }
      });
      
      stripeCustomerId = customer.id;
      
      // ユーザー情報を更新
      await prisma.user.update({
        where: { id: user?.id },
        data: { stripeCustomerId }
      });
    }
    
    // SetupIntent作成
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
    });
    
    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (error) {
    console.error('Error creating SetupIntent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}