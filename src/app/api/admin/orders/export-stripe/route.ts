// src/app/api/admin/orders/export-stripe/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';
import { stringify } from 'csv-stringify/sync';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 管理者かどうかチェックする簡易関数
async function isAdmin(userId: string) {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user?.role === 'ADMIN';
}

export async function GET(request: Request) {
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
    
    const url = new URL(request.url);
    // 日付範囲のパラメータを取得（デフォルトは過去30日）
    const startDate = url.searchParams.get('start') || 
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = url.searchParams.get('end') || 
      new Date().toISOString().split('T')[0];
    
    // Stripeから支払いデータを取得
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
    const endTimestamp = Math.floor(new Date(endDate + 'T23:59:59').getTime() / 1000);
    
    // 支払い一覧を取得
    const payments = await stripe.paymentIntents.list({
      limit: 100,
      created: {
        gte: startTimestamp,
        lte: endTimestamp
      },
      expand: ['data.customer']
    });
    
    // 処理したデータを格納する配列
    const processedData = [];
    
    // 支払いデータを処理
    for (const payment of payments.data) {
      if (payment.status === 'succeeded') {
        // 既存の注文レコードを確認
        let orderRecord = await prisma.order.findFirst({
          where: { stripePaymentIntentId: payment.id }
        });
        
        // 注文レコードがなければ作成する
        if (!orderRecord) {
          // 顧客情報を取得
          let customerId = typeof payment.customer === 'string' ? payment.customer : payment.customer?.id;
          let user = null;
          
          if (payment.metadata?.userId) {
            user = await prisma.user.findUnique({
              where: { id: payment.metadata.userId }
            });
          } else if (customerId) {
            user = await prisma.user.findFirst({
              where: { stripeCustomerId: customerId }
            });
          }
          
          // 注文を作成
          orderRecord = await prisma.order.create({
            data: {
              orderNumber: `ORD-${payment.id.slice(-8).toUpperCase()}`,
              totalAmount: payment.amount / 100,
              status: 'PENDING',
              shippingAddress: {
                name: user?.name || 'Unknown',
                email: user?.email || 'Unknown',
                address: user?.address || 'Unknown',
                postalCode: user?.postalCode || 'Unknown',
                prefecture: user?.prefecture || 'Unknown',
                city: user?.city || 'Unknown',
                phoneNumber: user?.phoneNumber || 'Unknown'
              },
              stripePaymentIntentId: payment.id,
              userId: user?.id
            }
          });
        }
        
        // ステータスが「未発送」の場合、「発送準備中」に更新
        if (orderRecord.status === 'PENDING') {
          await prisma.order.update({
            where: { id: orderRecord.id },
            data: { status: 'PROCESSING' }
          });
          
          orderRecord.status = 'PROCESSING';
        }
        
        // ユーザー情報を取得
        const user = orderRecord.userId ? 
          await prisma.user.findUnique({
            where: { id: orderRecord.userId }
          }) : null;
        
        // CSV用データに追加
        processedData.push({
          注文番号: orderRecord.orderNumber,
          注文日: new Date(payment.created * 1000).toLocaleDateString('ja-JP'),
          氏名: user?.name || (orderRecord.shippingAddress as any)?.name || 'Unknown',
          メールアドレス: user?.email || (orderRecord.shippingAddress as any)?.email || 'Unknown',
          電話番号: user?.phoneNumber || (orderRecord.shippingAddress as any)?.phoneNumber || 'Unknown',
          郵便番号: user?.postalCode || (orderRecord.shippingAddress as any)?.postalCode || 'Unknown',
          都道府県: user?.prefecture || (orderRecord.shippingAddress as any)?.prefecture || 'Unknown',
          市区町村: user?.city || (orderRecord.shippingAddress as any)?.city || 'Unknown',
          住所: user?.address || (orderRecord.shippingAddress as any)?.address || 'Unknown',
          金額: `${(payment.amount / 100).toLocaleString()}円`,
          ステータス: getStatusLabel(orderRecord.status)
        });
      }
    }
    
    // CSVに変換
    const csv = stringify(processedData, {
      header: true,
      quoted: true
    });
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=UTF-8',
        'Content-Disposition': `attachment; filename="stripe-orders-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting orders from Stripe:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ステータスラベルを取得する関数
function getStatusLabel(status: string): string {
  switch (status) {
    case 'PENDING': return '未発送';
    case 'PROCESSING': return '発送準備中';
    case 'SHIPPED': return '発送済み';
    case 'DELIVERED': return '配達済み';
    default: return status;
  }
}