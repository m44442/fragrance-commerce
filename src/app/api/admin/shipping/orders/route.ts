import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/next-auth/options';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 管理者権限チェック
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // 発送管理用の注文データを取得
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                title: true,
                price: true
              }
            }
          }
        },
        shippingAddress: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // データを発送管理画面用にフォーマット
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber || `ORD-${order.id.slice(-8)}`,
      user: {
        name: order.user.name,
        email: order.user.email
      },
      products: order.orderItems.map(item => ({
        name: item.product?.title || 'Unknown Product',
        quantity: item.quantity,
        price: item.price
      })),
      shippingAddress: order.shippingAddress ? {
        name: order.shippingAddress.name,
        postalCode: order.shippingAddress.postalCode,
        prefecture: order.shippingAddress.prefecture,
        city: order.shippingAddress.city,
        address: order.shippingAddress.address1 + (order.shippingAddress.address2 || ''),
        phone: order.shippingAddress.phone
      } : null,
      status: order.shippingStatus || 'PENDING',
      createdAt: order.createdAt.toISOString(),
      shippedAt: order.shippedAt?.toISOString(),
      total: order.total
    }));

    return NextResponse.json({ 
      orders: formattedOrders,
      total: formattedOrders.length 
    });

  } catch (error) {
    console.error('Failed to fetch shipping orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}