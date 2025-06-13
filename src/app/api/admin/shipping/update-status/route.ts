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
    const { orderIds, status } = body;

    if (!orderIds || !Array.isArray(orderIds)) {
      return NextResponse.json({ error: 'Invalid order IDs' }, { status: 400 });
    }

    if (!status || !['PENDING', 'PREPARING', 'SHIPPED', 'DELIVERED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // ステータス更新データを準備
    const updateData: any = {
      shippingStatus: status,
      updatedAt: new Date()
    };

    // 発送済みの場合は発送日を設定
    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    }

    // 注文ステータスを更新
    const updateResult = await prisma.order.updateMany({
      where: {
        id: { in: orderIds }
      },
      data: updateData
    });

    if (updateResult.count === 0) {
      return NextResponse.json({ error: 'No orders found to update' }, { status: 404 });
    }

    // 発送済みの場合、メール通知などの追加処理を行う場合はここに追加
    if (status === 'SHIPPED') {
      // TODO: 発送通知メールの送信処理
      console.log(`${orderIds.length} orders shipped, notification emails should be sent`);
    }

    return NextResponse.json({ 
      message: `${updateResult.count} orders updated to ${status}`,
      updatedCount: updateResult.count
    });

  } catch (error) {
    console.error('Failed to update order status:', error);
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    );
  }
}