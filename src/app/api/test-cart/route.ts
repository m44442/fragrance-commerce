import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/next-auth/options';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    console.log('=== Test Cart API ===');
    console.log('Session:', JSON.stringify(session, null, 2));
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'No user ID',
        session: session,
        hasSession: !!session,
        hasUser: !!session?.user,
        hasUserId: !!session?.user?.id
      }, { status: 401 });
    }

    // ユーザーIDの型チェック
    const userId = session.user.id;
    if (typeof userId !== 'string') {
      return NextResponse.json({ 
        error: 'Invalid user ID type',
        userIdType: typeof userId,
        userId: userId
      }, { status: 400 });
    }

    // テストで既存の商品を使用
    const testProduct = await prisma.product.findFirst();

    if (!testProduct) {
      return NextResponse.json({ 
        error: 'No test product found',
        message: 'テスト商品がデータベースにありません'
      }, { status: 404 });
    }

    // ユーザーのカートを取得または作成
    let cart = await prisma.cart.findUnique({
      where: { 
        userId: userId 
      }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { 
          userId: userId 
        }
      });
    }

    // 既存のカートアイテムをチェック
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: testProduct.id,
        isSample: false
      }
    });

    let cartItem;
    if (existingItem) {
      // 既存アイテムの数量を更新
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + 1 },
        include: { product: true }
      });
    } else {
      // 新しいアイテムを追加
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: testProduct.id,
          quantity: 1,
          isSample: false
        },
        include: {
          product: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      cartItem: cartItem,
      message: 'テスト商品をカートに追加しました'
    });

  } catch (error) {
    console.error('Test cart error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      details: errorMessage,
      stack: error instanceof Error ? error.stack : 'No stack trace'
    }, { status: 500 });
  }
}