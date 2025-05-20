// src/app/api/admin/orders/[id]/notes/route.ts
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

export async function POST(
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
    const { notes } = await request.json();
    
    // 注文が存在するか確認
    const existingOrder = await prisma.order.findUnique({
      where: { id }
    });
    
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    // 注文のメモを更新
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        adminNotes: notes,
        // 更新者情報も記録
        lastUpdatedBy: session.user.id,
        updatedAt: new Date()
      }
    });
    
    return NextResponse.json({ 
      success: true,
      message: 'メモを保存しました'
    });
  } catch (error) {
    console.error('Error saving order notes:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 });
  }
}