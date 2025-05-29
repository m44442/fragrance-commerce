// src/app/api/users/[userId]/payment-methods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 支払い方法一覧の取得
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id || session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: params.userId }
    });
    
    if (!user?.stripeCustomerId) {
      return NextResponse.json({ paymentMethods: [] });
    }
    
    // Stripeから支払い方法を取得
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });
    
    return NextResponse.json({ paymentMethods: paymentMethods.data });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 新しい支払い方法を追加
export async function POST(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id || session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { paymentMethodId } = await request.json();
    
    // ユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: params.userId }
    });
    
    if (!user?.stripeCustomerId) {
      return NextResponse.json({ error: 'User has no Stripe customer ID' }, { status: 400 });
    }
    
    // 支払い方法をアタッチ
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: user.stripeCustomerId,
    });
    
    // デフォルトの支払い方法として設定
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding payment method:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 支払い方法を削除
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id || session.user.id !== params.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { paymentMethodId } = await request.json();
    
    await stripe.paymentMethods.detach(paymentMethodId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing payment method:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}