import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

// GET: カート内の商品を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;

    const cartItem = await prisma.cartItem.findFirst({
      where: {
        cart: {
          userId: session.user.id
        },
        productId: productId
      },
      include: {
        product: true
      }
    });

    return NextResponse.json(cartItem);
  } catch (error) {
    console.error('Error fetching cart item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: カートに商品を追加
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;
    const { quantity = 1 } = await request.json();

    // ユーザーのカートを取得または作成
    let cart = await prisma.cart.findUnique({
      where: { userId: session.user.id }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: session.user.id }
      });
    }

    // カート内の既存アイテムを確認
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId
      }
    });

    if (existingItem) {
      // 既存アイテムの数量を更新
      const updatedItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true }
      });
      return NextResponse.json(updatedItem);
    } else {
      // 新しいアイテムを追加
      const newItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity
        },
        include: { product: true }
      });
      return NextResponse.json(newItem);
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: カートから商品を削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;

    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          userId: session.user.id
        },
        productId: productId
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}