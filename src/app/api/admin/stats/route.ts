import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { message: '認証が必要です' },
        { status: 401 }
      );
    }

    // 管理者権限をチェック
    const adminUser = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json(
        { message: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    // 今月の開始日を計算
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // 統計データを並行取得
    const [
      totalUsers,
      totalOrders,
      newUsersThisMonth,
      orderAggregation
    ] = await Promise.all([
      // 総ユーザー数
      prisma.user.count(),
      
      // 総注文数
      prisma.order.count(),
      
      // 今月の新規ユーザー数
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),
      
      // 総売上の計算
      prisma.order.aggregate({
        _sum: {
          totalAmount: true,
        },
        where: {
          status: {
            not: 'CANCELLED',
          },
        },
      }),
    ]);

    const totalRevenue = orderAggregation._sum.totalAmount || 0;

    const stats = {
      totalUsers,
      totalOrders,
      totalRevenue: Math.round(totalRevenue),
      newUsersThisMonth,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Admin stats fetch error:', error);
    return NextResponse.json(
      { message: '統計情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}