// src/app/api/cart/[productId]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { added, quantity = 1 } = await request.json();
    
    // ユーザーのカートを取得または作成
    let cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
    });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: session.user.id,
        },
      });
    }
    
    if (added) {
      // カートアイテムを確認
      const existingItem = await prisma.cartItem.findFirst({
        where: {
          cartId: cart.id,
          productId: params.productId,
        },
      });
      
      if (existingItem) {
        // 数量を更新
        await prisma.cartItem.update({
          where: {
            id: existingItem.id,
          },
          data: {
            quantity: existingItem.quantity + quantity,
          },
        });
      } else {
        // 新しいアイテムを追加
        await prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId: params.productId,
            quantity,
          },
        });
      }
    } else {
      // カートから削除
      await prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          productId: params.productId,
        },
      });
    }
    
    // カートの更新時間を更新
    await prisma.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });
    
    return NextResponse.json({ success: true, added });
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    // 認証チェック
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // カートの状態を確認
    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          where: {
            productId: params.productId,
          },
        },
      },
    });
    
    const inCart = cart?.items.length ? true : false;
    const quantity = cart?.items[0]?.quantity || 0;
    
    return NextResponse.json({ inCart, quantity });
  } catch (error) {
    console.error('Error checking cart status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}