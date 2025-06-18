import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(nextAuthOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { message: '管理者権限が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || '30d';

    // 日付範囲を計算
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // 並行でデータを取得
    const [
      ordersData,
      usersData,
      conversionData,
      productSales
    ] = await Promise.all([
      // 売上推移データ
      prisma.order.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
          status: {
            notIn: ['cancelled', 'refunded']
          }
        },
        select: {
          createdAt: true,
          total: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),

      // ユーザー成長データ
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: startDate,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),

      // コンバージョンメトリクス
      Promise.all([
        prisma.user.count(),
        prisma.order.count({
          where: {
            status: {
              notIn: ['cancelled', 'refunded']
            },
            createdAt: { gte: startDate },
          },
        }),
        prisma.order.aggregate({
          where: {
            status: {
              notIn: ['cancelled', 'refunded']
            },
            createdAt: { gte: startDate },
          },
          _sum: { total: true },
          _avg: { total: true },
        }),
      ]),

      // 商品別売上（実データ）
      prisma.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            status: {
              notIn: ['cancelled', 'refunded']
            },
            createdAt: { gte: startDate }
          }
        },
        _sum: {
          quantity: true,
          price: true
        },
        _count: {
          id: true
        },
        orderBy: {
          _sum: {
            price: 'desc'
          }
        },
        take: 10
      }),
    ]);

    // 売上推移を日別に集計
    const salesByDate = new Map<string, { amount: number; orders: number }>();
    ordersData.forEach(order => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      const existing = salesByDate.get(dateKey) || { amount: 0, orders: 0 };
      salesByDate.set(dateKey, {
        amount: existing.amount + (order.total || 0),
        orders: existing.orders + 1,
      });
    });

    const salesOverTime = Array.from(salesByDate.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      orders: data.orders,
    }));

    // ユーザー成長を日別に集計
    const usersByDate = new Map<string, number>();
    let cumulativeUsers = 0;
    usersData.forEach(user => {
      const dateKey = user.createdAt.toISOString().split('T')[0];
      cumulativeUsers++;
      usersByDate.set(dateKey, cumulativeUsers);
    });

    const userGrowth = Array.from(usersByDate.entries()).map(([date, users], index, arr) => ({
      date,
      users,
      newUsers: index === 0 ? users : users - (arr[index - 1]?.[1] || 0),
    }));

    // コンバージョンメトリクス
    const [totalUsers, totalOrders, orderAggregation] = conversionData;
    const totalRevenue = orderAggregation._sum.total || 0;
    const averageOrderValue = orderAggregation._avg.total || 0;
    const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;

    // トップ商品（実データ）
    const productIds = productSales.map(item => item.productId).filter(id => id !== null) as string[];
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      include: {
        brand: {
          select: {
            name: true
          }
        }
      }
    });

    const topProducts = productSales.map(salesData => {
      const product = products.find(p => p.id === salesData.productId);
      return {
        id: salesData.productId,
        name: product?.name || '商品名',
        sales: salesData._sum?.quantity || 0,
        revenue: (salesData._sum?.price || 0) * (salesData._sum?.quantity || 0),
      };
    });

    // カテゴリ別売上（モックデータ）
    const revenueByCategory = [
      { category: 'フルーツ系', revenue: totalRevenue * 0.3, percentage: 30 },
      { category: 'フローラル', revenue: totalRevenue * 0.25, percentage: 25 },
      { category: 'ウッディ', revenue: totalRevenue * 0.2, percentage: 20 },
      { category: 'オリエンタル', revenue: totalRevenue * 0.15, percentage: 15 },
      { category: 'その他', revenue: totalRevenue * 0.1, percentage: 10 },
    ];

    const analyticsData = {
      salesOverTime,
      topProducts,
      userGrowth,
      conversionMetrics: {
        totalVisitors: totalUsers * 5, // モック: ユーザーの5倍の訪問者
        totalUsers,
        totalOrders,
        conversionRate,
        averageOrderValue: Math.round(averageOrderValue),
      },
      revenueByCategory,
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error('Analytics data fetch error:', error);
    return NextResponse.json(
      { message: '分析データの取得に失敗しました' },
      { status: 500 }
    );
  }
}