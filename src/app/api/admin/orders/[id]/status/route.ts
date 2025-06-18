import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!(session?.user as any)?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();

    // バリデーション（ShippingStatusに合わせる）
    const validStatuses = ['PENDING', 'PREPARING', 'SHIPPED', 'DELIVERED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: '無効なステータスです' 
      }, { status: 400 });
    }

    const { id } = await params;
    
    // 注文の存在確認
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });

    if (!existingOrder) {
      return NextResponse.json({ error: '注文が見つかりません' }, { status: 404 });
    }

    // ステータス変更の妥当性チェック
    if (existingOrder.paymentStatus === 'CANCELLED' || existingOrder.paymentStatus === 'REFUNDED') {
      return NextResponse.json({ 
        error: 'キャンセル済みまたは返金済みの注文のステータスは変更できません' 
      }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { 
        shippingStatus: status,
        updatedAt: new Date()
      },
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
              include: {
                brand: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        shippingAddress: true
      }
    });

    // TODO: ステータス変更通知メールの送信
    // if (status === 'shipped') {
    //   await sendShippingNotificationEmail(order);
    // }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}