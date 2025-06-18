import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';

function escapeCSV(value: any): string {
  if (value == null) return '';
  const stringValue = String(value);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(nextAuthOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'analytics';
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

    let csvContent = '';
    let filename = '';

    switch (type) {
      case 'orders':
        // 注文データのエクスポート
        const orders = await prisma.order.findMany({
          where: {
            createdAt: { gte: startDate }
          },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            },
            items: {
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
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        csvContent = '注文ID,注文日時,顧客名,顧客メール,ステータス,合計金額,商品名,数量,単価,配送先\n';
        
        orders.forEach(order => {
          order.items.forEach(item => {
            const row = [
              order.id,
              order.createdAt.toISOString(),
              order.user.name,
              order.user.email,
              order.status,
              order.total,
              item.product.name,
              item.quantity,
              item.price,
              order.shippingAddress ? 
                `${order.shippingAddress.prefecture}${order.shippingAddress.city}${order.shippingAddress.address}` : 
                ''
            ].map(escapeCSV).join(',');
            csvContent += row + '\n';
          });
        });

        filename = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'users':
        // ユーザーデータのエクスポート
        const users = await prisma.user.findMany({
          where: {
            createdAt: { gte: startDate }
          },
          include: {
            _count: {
              select: {
                orders: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        csvContent = 'ユーザーID,登録日時,名前,メール,管理者,注文回数\n';
        
        users.forEach(user => {
          const row = [
            user.id,
            user.createdAt.toISOString(),
            user.name,
            user.email,
            user.isAdmin ? 'はい' : 'いいえ',
            user._count.orders
          ].map(escapeCSV).join(',');
          csvContent += row + '\n';
        });

        filename = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'products':
        // 商品データのエクスポート
        const products = await prisma.product.findMany({
          include: {
            brand: {
              select: {
                name: true
              }
            },
            _count: {
              select: {
                OrderItem: true,
                favorites: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

        csvContent = '商品ID,商品名,ブランド,価格,試供品価格,在庫,試供品在庫,ステータス,注文回数,お気に入り数,作成日時\n';
        
        products.forEach(product => {
          const row = [
            product.id,
            product.name,
            product.brand.name,
            product.price,
            product.samplePrice,
            product.stock,
            product.sampleStock,
            product.isActive ? '販売中' : '停止中',
            product._count.OrderItem,
            product._count.favorites,
            product.createdAt.toISOString()
          ].map(escapeCSV).join(',');
          csvContent += row + '\n';
        });

        filename = `products-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        // 分析データのエクスポート
        const analyticsOrders = await prisma.order.findMany({
          where: {
            createdAt: { gte: startDate },
            status: {
              notIn: ['cancelled', 'refunded']
            }
          },
          select: {
            id: true,
            createdAt: true,
            total: true,
            status: true
          },
          orderBy: {
            createdAt: 'asc'
          }
        });

        csvContent = '日付,注文数,売上金額,平均注文金額\n';
        
        // 日別に集計
        const dailyStats = new Map<string, { orders: number; revenue: number }>();
        
        analyticsOrders.forEach(order => {
          const dateKey = order.createdAt.toISOString().split('T')[0];
          const existing = dailyStats.get(dateKey) || { orders: 0, revenue: 0 };
          dailyStats.set(dateKey, {
            orders: existing.orders + 1,
            revenue: existing.revenue + (order.total || 0)
          });
        });

        dailyStats.forEach((stats, date) => {
          const avgOrderValue = stats.orders > 0 ? stats.revenue / stats.orders : 0;
          const row = [
            date,
            stats.orders,
            stats.revenue,
            Math.round(avgOrderValue)
          ].map(escapeCSV).join(',');
          csvContent += row + '\n';
        });

        filename = `analytics-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
    }

    // CSVファイルとしてレスポンスを返す
    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache'
      }
    });

    return response;

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'エクスポートに失敗しました' },
      { status: 500 }
    );
  }
}