import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

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
    const { quantity } = await request.json();

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 });
    }

    // ユーザーのカートを取得
    const cart = await prisma.cart.findUnique({
      where: { userId: session.user.id }
    });

    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    // カートアイテムの数量を更新
    const updatedItem = await prisma.cartItem.updateMany({
      where: {
        cartId: cart.id,
        productId: productId
      },
      data: {
        quantity: quantity
      }
    });

    if (updatedItem.count === 0) {
      return NextResponse.json({ error: 'Item not found in cart' }, { status: 404 });
    }

    return NextResponse.json({ success: true, quantity });
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}