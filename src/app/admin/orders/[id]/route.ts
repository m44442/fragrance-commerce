// src/app/api/admin/orders/[id]/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

// 管理者かどうかチェックする簡易関数
async function isAdmin(userId: string) {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user?.role === 'ADMIN';
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 管理者権限チェック
    const adminCheck = await isAdmin(session.user.id);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = params;
    
    // 注文データを取得
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            postalCode: true,
            prefecture: true,
            city: true,
            address: true,
            phoneNumber: true
          }
        },
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
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 });
  }
}

// 注文情報の更新API
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 管理者権限チェック
    const adminCheck = await isAdmin(session.user.id);
    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = params;
    const data = await request.json();
    
    // 更新可能なフィールドを制限
    const allowedUpdates = ['status', 'shippedAt', 'adminNotes'];
    const updateData = {};
    
    Object.keys(data).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updateData[key] = data[key];
      }
    });
    
    // 発送済みステータスに更新する場合は発送日時を自動設定
    if (data.status === 'SHIPPED' && !data.shippedAt) {
      updateData['shippedAt'] = new Date();
    }
    
    // 注文データを更新
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      order: updatedOrder,
      message: '注文情報を更新しました'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 });
  }
}