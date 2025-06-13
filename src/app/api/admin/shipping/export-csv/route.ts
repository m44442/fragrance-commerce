import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/next-auth/options';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { orderIds } = body;

    if (!orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json({ error: 'Invalid order IDs' }, { status: 400 });
    }

    // 指定された注文データを取得
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        shippingStatus: 'PENDING'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                title: true,
                brand: true
              }
            }
          }
        },
        shippingAddress: true
      }
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: 'No pending orders found' }, { status: 404 });
    }

    // CSVヘッダー
    const csvHeaders = [
      '注文番号',
      '注文日',
      '顧客名',
      'メールアドレス',
      '郵便番号',
      '都道府県',
      '市区町村',
      '住所',
      '電話番号',
      '商品名',
      'ブランド',
      '数量',
      '金額',
      '合計金額'
    ];

    // CSVデータ生成
    const csvRows = [csvHeaders.join(',')];
    
    orders.forEach(order => {
      const baseInfo = [
        order.orderNumber || `ORD-${order.id.slice(-8)}`,
        order.createdAt.toISOString().split('T')[0],
        `"${order.user.name || '名前未設定'}"`,
        `"${order.user.email || ''}"`,
        `"${order.shippingAddress?.postalCode || ''}"`,
        `"${order.shippingAddress?.prefecture || ''}"`,
        `"${order.shippingAddress?.city || ''}"`,
        `"${(order.shippingAddress?.address1 || '') + (order.shippingAddress?.address2 || '')}"`,
        `"${order.shippingAddress?.phone || ''}"`
      ];

      if (order.orderItems.length === 0) {
        // 商品がない場合
        csvRows.push([
          ...baseInfo,
          '商品情報なし',
          '',
          '0',
          '0',
          order.total.toString()
        ].join(','));
      } else {
        // 各商品について行を作成
        order.orderItems.forEach((item, index) => {
          const row = [
            ...baseInfo,
            `"${item.product?.title || 'Unknown Product'}"`,
            `"${item.product?.brand || ''}"`,
            item.quantity.toString(),
            item.price.toString(),
            index === 0 ? order.total.toString() : '' // 合計は最初の商品行にのみ表示
          ];
          csvRows.push(row.join(','));
        });
      }
    });

    const csvContent = csvRows.join('\n');

    // 注文ステータスを「発送準備」に更新
    await prisma.order.updateMany({
      where: {
        id: { in: orderIds }
      },
      data: {
        shippingStatus: 'PREPARING',
        updatedAt: new Date()
      }
    });

    // CSVファイルとして返す
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="shipping_orders_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

    return response;

  } catch (error) {
    console.error('Failed to export CSV:', error);
    return NextResponse.json(
      { error: 'Failed to export CSV' },
      { status: 500 }
    );
  }
}