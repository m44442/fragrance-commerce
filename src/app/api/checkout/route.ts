// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { productId, amount, products } = await request.json();
    
    // 単品購入の場合
    if (productId && productId !== 'cart') {
      // 商品情報を取得
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { brand: true }
      });
      
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }

      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'jpy',
        metadata: {
          productId,
          userId: session.user.id,
          type: 'single_purchase'
        },
        automatic_payment_methods: {
          enabled: true,
        }
      });
      
      return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    }
    
    // カート購入の場合
    if (productId === 'cart' || products) {
      let cartItems = [];
      
      if (products) {
        cartItems = products;
      } else {
        // カートから商品を取得
        const cart = await prisma.cart.findUnique({
          where: { userId: session.user.id },
          include: {
            items: {
              include: {
                product: {
                  include: { brand: true }
                }
              }
            }
          }
        });
        
        if (!cart || cart.items.length === 0) {
          return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }
        
        cartItems = cart.items;
      }

      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'jpy',
        metadata: {
          userId: session.user.id,
          type: 'cart_purchase',
          itemCount: cartItems.length.toString()
        },
        automatic_payment_methods: {
          enabled: true,
        }
      });
      
      return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    
  } catch (error) {
    console.error('Error creating PaymentIntent:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}