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
    
    const { productId } = params;
    const { quantity } = await request.json();
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    if (typeof quantity !== 'number' || quantity <= 0) {
      return NextResponse.json({ error: 'Valid quantity is required' }, { status: 400 });
    }

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

    // カート内の商品を検索
    const existingCartItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId,
      },
    });

    // カート内の商品数量を直接更新
    if (existingCartItem) {
      await prisma.cartItem.update({
        where: {
          id: existingCartItem.id
        },
        data: {
          quantity: quantity
        }
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId,
          quantity: quantity
        }
      });
    }
    
    // 更新後のカート情報を取得して返す
    const cartItems = await prisma.cartItem.findMany({
      where: {
        cartId: cart.id
      },
      include: {
        product: true
      }
    });
    
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = cartItems.reduce((total, item) => {
      const price = item.product.discountPrice || item.product.price;
      return total + price * item.quantity;
    }, 0);
    
    return NextResponse.json({
      items: cartItems,
      totalItems,
      totalPrice
    });
  } catch (error) {
    console.error('Error updating cart quantity:', error);
    return NextResponse.json({ error: 'Failed to update quantity' }, { status: 500 });
  }
}