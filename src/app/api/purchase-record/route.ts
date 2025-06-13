// src/app/api/purchase-record/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { productId, paymentIntentId } = await request.json();
    
    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Missing paymentIntentId' }, { status: 400 });
    }
    
    console.log('=== Creating purchase record manually ===');
    console.log('userId:', session.user.id);
    console.log('productId:', productId);
    console.log('paymentIntentId:', paymentIntentId);
    
    // カート購入の場合
    if (productId === 'cart') {
      console.log('Processing cart purchase...');
      
      // カートから商品を取得
      const cart = await prisma.cart.findUnique({
        where: { userId: session.user.id },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });
      
      if (!cart || cart.items.length === 0) {
        return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
      }
      
      console.log('Cart items found:', cart.items.length);
      
      // 各カートアイテムの購入履歴を作成
      const purchasePromises = cart.items.map(async (item) => {
        // 既存の購入履歴があるかチェック
        const existingPurchase = await prisma.purchase.findUnique({
          where: {
            userId_fragranceId: {
              userId: session.user.id,
              fragranceId: item.productId
            }
          }
        });
        
        if (!existingPurchase) {
          return prisma.purchase.create({
            data: {
              userId: session.user.id,
              fragranceId: item.productId,
            },
          });
        }
        return existingPurchase;
      });
      
      const purchases = await Promise.all(purchasePromises);
      console.log('Created purchases:', purchases.length);
      
      // カートをクリア
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      });
      console.log('Cart cleared');
      
      return NextResponse.json({ 
        success: true, 
        purchaseCount: purchases.length,
        message: 'Cart purchase records created successfully' 
      });
    }
    
    // 商品の存在確認
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // 既存の購入履歴があるかチェック
    const existingPurchase = await prisma.purchase.findUnique({
      where: {
        userId_fragranceId: {
          userId: session.user.id,
          fragranceId: productId
        }
      }
    });
    
    if (existingPurchase) {
      console.log('Purchase record already exists');
      return NextResponse.json({ success: true, message: 'Purchase record already exists' });
    }
    
    // 購入履歴を作成
    const purchase = await prisma.purchase.create({
      data: {
        userId: session.user.id,
        fragranceId: productId,
      },
    });
    
    console.log('Purchase record created successfully:', {
      id: purchase.id,
      userId: purchase.userId,
      fragranceId: purchase.fragranceId,
      createdAt: purchase.createdAt
    });
    
    // カートから商品を削除（存在する場合）
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id }
    });
    
    if (cart) {
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId: productId
        }
      });
      console.log('Removed item from cart');
    }
    
    return NextResponse.json({ 
      success: true, 
      purchaseId: purchase.id,
      message: 'Purchase record created successfully' 
    });
    
  } catch (error) {
    console.error('Error creating purchase record:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}