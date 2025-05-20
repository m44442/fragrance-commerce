// src/app/api/admin/orders/update-status/route.ts 
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

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

// エラーハンドリング用のラッパー関数
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transporter = getTransporter();
    const fromName = process.env.MAIL_FROM_NAME || 'Shop';
    const fromAddress = process.env.MAIL_FROM_ADDRESS || process.env.SMTP_USER;
    
    if (!fromAddress) {
      throw new Error('送信元アドレスが設定されていません');
    }
    
    const result = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      html
    });
    
    console.log(`メール送信成功: ${to}, ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error('メール送信エラー:', error);
    throw error;
  }
}

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
    
    const { orderIds, status, sendNotification = false } = await request.json();
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      return NextResponse.json({ error: 'Order IDs are required' }, { status: 400 });
    }
    
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Valid status is required. Must be one of: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }
    
    // ステータス更新データを準備
    const updateData: any = { status };
    
    // 発送済みステータスの場合は発送日時を記録
    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    }
    
    // 一括更新の結果を追跡
    const updateResults = {
      success: [],
      error: []
    };
    
    // 送信したメールを追跡
    const sentEmails = [];
    const failedEmails = [];
    
    // 一括更新
    for (const orderId of orderIds) {
      try {
        await prisma.order.update({
          where: { id: orderId },
          data: updateData
        });
        updateResults.success.push(orderId);
      } catch (error) {
        console.error(`注文 ${orderId} の更新に失敗:`, error);
        updateResults.error.push({ id: orderId, error: error instanceof Error ? error.message : '不明なエラー' });
      }
    }
    
    // 通知フラグがオンで、発送済みステータスの場合はメール送信
    if (sendNotification && status === 'SHIPPED' && updateResults.success.length > 0) {
      const orders = await prisma.order.findMany({
        where: { 
          id: { in: updateResults.success },
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
            
            await sendEmail(
              userEmail,
              '【ご注文の商品を発送しました】',
              `
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
            );
            
            // 通知済みフラグを更新
            await prisma.order.update({
              where: { id: order.id },
              data: { notificationSent: true }
            });
            
            sentEmails.push(userEmail);
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
    
    return NextResponse.json({ 
      success: true, 
      updatedCount: updateResults.success.length,
      failedCount: updateResults.error.length,
      failedOrders: updateResults.error.length > 0 ? updateResults.error : undefined,
      message: `${updateResults.success.length}件の注文を「${getStatusLabel(status)}」に更新しました`,
      emailsSent: sentEmails.length,
      emailsFailed: failedEmails.length,
      emailFailDetails: failedEmails.length > 0 ? failedEmails : undefined
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : '不明なエラー'
    }, { status: 500 });
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