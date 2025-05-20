// src/app/api/admin/orders/bulk-actions/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { stringify } from 'csv-stringify/sync';

// 管理者かどうかチェックする簡易関数
async function isAdmin(userId: string) {
  if (!userId) return false;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });
  return user?.role === 'ADMIN';
}

// メール送信用のトランスポーター
const getTransporter = () => {
  // 環境変数の検証
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  
  if (!user || !pass) {
    console.error('SMTP設定が不完全です: ユーザー名またはパスワードが未設定');
    throw new Error('SMTP configuration is incomplete');
  }
  
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass }
  });
};

/**
 * 一括操作API
 * 
 * アクション：
 * - update-status: 注文ステータスの一括更新
 * - delete: 注文の一括削除（ソフトデリート）
 * - export-csv: 選択された注文のCSVエクスポート
 */
export async function POST(request: Request) {
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
    
    const { action, orderIds, data } = await request.json();
    
    if (!action || !orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Action and order IDs are required' }, { status: 400 });
    }
    
    let result;
    
    switch (action) {
      case 'update-status':
        result = await updateOrderStatus(orderIds, data?.status, data?.sendNotification);
        break;
      case 'delete':
        result = await deleteOrders(orderIds);
        break;
      case 'export-csv':
        result = await generateCSV(orderIds);
        break;
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in bulk action:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 });
  }
}

/**
 * 注文ステータスの一括更新
 */
async function updateOrderStatus(orderIds: string[], status?: string, sendNotification: boolean = false) {
  // ステータスのバリデーション
  const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
  if (!status || !validStatuses.includes(status)) {
    throw new Error(`有効なステータスが必要です。次のいずれかを指定してください: ${validStatuses.join(', ')}`);
  }
  
  // ステータス更新データを準備
  const updateData: any = { status };
  
  // 発送済みステータスの場合は発送日時を記録
  if (status === 'SHIPPED') {
    updateData.shippedAt = new Date();
  }
  
  // 一括更新の結果を追跡
  const results = {
    success: [],
    error: []
  };
  
  // 送信したメールを追跡
  const sentEmails = [];
  const failedEmails = [];
  
  // 一括更新
  for (const orderId of orderIds) {
    try {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
        include: {
          user: true
        }
      });
      results.success.push({
        id: orderId,
        status: updated.status,
        orderNumber: updated.orderNumber
      });
    } catch (error) {
      console.error(`注文 ${orderId} の更新に失敗:`, error);
      results.error.push({ 
        id: orderId, 
        error: error instanceof Error ? error.message : '不明なエラー' 
      });
    }
  }
  
  // 通知フラグがオンで、発送済みステータスの場合はメール送信
  if (sendNotification && status === 'SHIPPED' && results.success.length > 0) {
    // 成功した注文のIDを取得
    const successIds = results.success.map(item => item.id);
    
    // 通知対象の注文を取得
    const orders = await prisma.order.findMany({
      where: { 
        id: { in: successIds },
        notificationSent: false
      },
      include: {
        user: {
          select: { 
            id: true,
            name: true, 
            email: true 
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    // メール送信処理
    for (const order of orders) {
      const userEmail = order.user?.email || (order.shippingAddress as any)?.email;
      const userName = order.user?.name || (order.shippingAddress as any)?.name || 'お客様';
      
      if (userEmail) {
        try {
          // 注文商品の情報を取得
          const productList = order.items?.map(item => {
            const productName = item.product?.name || '商品';
            return `<li>${productName} × ${item.quantity}個</li>`;
          }).join('') || '';
          
          // 注文詳細ページのURL
          const orderDetailUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/orders/${order.id}`;
          
          // トランスポーターを取得
          const transporter = getTransporter();
          
          // メール送信
          await transporter.sendMail({
            from: `"${process.env.MAIL_FROM_NAME || 'Shop'}" <${process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER}>`,
            to: userEmail,
            subject: '【ご注文の商品を発送しました】',
            html: `
              <p>${userName} 様</p>
              <p>この度はご注文いただき、誠にありがとうございます。</p>
              <p>ご注文いただいた商品を発送しましたのでお知らせいたします。</p>
              <p>■注文番号：${order.orderNumber}</p>
              <p>■発送日：${order.shippedAt ? new Date(order.shippedAt).toLocaleDateString('ja-JP') : new Date().toLocaleDateString('ja-JP')}</p>
              
              <p>■発送商品</p>
              <ul>
                ${productList}
              </ul>
              
              <p>商品の到着まで今しばらくお待ちください。</p>
              <p>注文の詳細は<a href="${orderDetailUrl}">こちら</a>からご確認いただけます。</p>
              <p>何かご不明な点がございましたら、お気軽にお問い合わせください。</p>
              <p>引き続きよろしくお願いいたします。</p>
            `
          });
          
          // 通知済みフラグを更新
          await prisma.order.update({
            where: { id: order.id },
            data: { notificationSent: true }
          });
          
          sentEmails.push({
            orderId: order.id,
            email: userEmail,
            orderNumber: order.orderNumber
          });
        } catch (error) {
          console.error(`注文 ${order.id} のメール送信に失敗:`, error);
          failedEmails.push({
            orderId: order.id,
            email: userEmail,
            error: error instanceof Error ? error.message : '不明なエラー'
          });
        }
      }
    }
  }
  
  return { 
    action: 'update-status',
    status,
    totalOrders: orderIds.length,
    updatedCount: results.success.length,
    failedCount: results.error.length,
    succeeded: results.success,
    failed: results.error,
    notification: sendNotification ? {
      emailsSent: sentEmails.length,
      emailsFailed: failedEmails.length,
      sentDetails: sentEmails,
      failedDetails: failedEmails
    } : null,
    message: `${results.success.length}件の注文を「${getStatusLabel(status)}」に更新しました`
  };
}

/**
 * 注文の一括削除（ソフトデリート）
 */
async function deleteOrders(orderIds: string[]) {
  // ソフトデリート用のデータ
  const deleteData = {
    isDeleted: true,
    deletedAt: new Date()
  };
  
  // 一括更新の結果を追跡
  const results = {
    success: [],
    error: []
  };
  
  // 一括削除
  for (const orderId of orderIds) {
    try {
      const deleted = await prisma.order.update({
        where: { id: orderId },
        data: deleteData
      });
      results.success.push({
        id: orderId,
        orderNumber: deleted.orderNumber
      });
    } catch (error) {
      console.error(`注文 ${orderId} の削除に失敗:`, error);
      results.error.push({
        id: orderId,
        error: error instanceof Error ? error.message : '不明なエラー'
      });
    }
  }
  
  return {
    action: 'delete',
    totalOrders: orderIds.length,
    deletedCount: results.success.length,
    failedCount: results.error.length,
    succeeded: results.success,
    failed: results.error,
    message: `${results.success.length}件の注文を削除しました`
  };
}

/**
 * 選択された注文のCSVエクスポート
 */
async function generateCSV(orderIds: string[]) {
  // 注文データを取得
  const orders = await prisma.order.findMany({
    where: {
      id: { in: orderIds }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phoneNumber: true,
          postalCode: true,
          prefecture: true,
          city: true,
          address: true
        }
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              price: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });
  
  // CSV用のデータを準備
  const csvData = orders.map(order => {
    const shippingAddress = order.shippingAddress as any || {};
    
    // 商品情報を文字列にフォーマット
    const products = order.items.map(item => {
      return `${item.product?.name || '不明な商品'} (${item.quantity}点)`;
    }).join('\n');
    
    return {
      注文番号: order.orderNumber || '',
      注文日: order.createdAt ? new Date(order.createdAt).toLocaleDateString('ja-JP') : '',
      氏名: order.user?.name || shippingAddress.name || '',
      メールアドレス: order.user?.email || shippingAddress.email || '',
      電話番号: order.user?.phoneNumber || shippingAddress.phoneNumber || '',
      郵便番号: order.user?.postalCode || shippingAddress.postalCode || '',
      都道府県: order.user?.prefecture || shippingAddress.prefecture || '',
      市区町村: order.user?.city || shippingAddress.city || '',
      住所: order.user?.address || shippingAddress.address || '',
      金額: `${order.totalAmount.toLocaleString()}円`,
      ステータス: getStatusLabel(order.status),
      購入商品: products
    };
  });
  
  // CSVに変換
  const csv = stringify(csvData, {
    header: true,
    quoted: true
  });
  
  // Base64でエンコード
  const base64Csv = Buffer.from(csv).toString('base64');
  
  return {
    action: 'export-csv',
    totalOrders: orders.length,
    csvData: base64Csv,
    filename: `orders-export-${new Date().toISOString().split('T')[0]}.csv`,
    message: `${orders.length}件の注文データをエクスポートしました`
  };
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
