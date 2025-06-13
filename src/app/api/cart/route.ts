// src/app/api/cart/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/next-auth/options';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // カート情報を取得
    const cart = await prisma.cart.findUnique({
      where: {
        userId: session.user.id,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                discountPrice: true,
                thumbnailUrl: true,
                brand: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    
    if (!cart) {
      return NextResponse.json({ items: [], totalItems: 0, totalPrice: 0 });
    }
    
    // レスポンスデータの整形
    const items = cart.items.map(item => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        discountPrice: item.product.discountPrice,
        brand: item.product.brand?.name || '',
        thumbnailUrl: item.product.thumbnailUrl,
      },
    }));
    
    const totalItems = items.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = items.reduce((acc, item) => {
      const price = item.product.discountPrice || item.product.price;
      return acc + (price * item.quantity);
    }, 0);
    
    return NextResponse.json({ items, totalItems, totalPrice });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}