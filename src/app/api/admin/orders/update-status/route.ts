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
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

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
    
    if (!status || !['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 });
    }
    
    // ステータス更新データを準備
    const updateData: any = { status };
    
    // 発送済みステータスの場合は発送日時を記録
    if (status === 'SHIPPED') {
      updateData.shippedAt = new Date();
    }
    
    // 一括更新
    for (const orderId of orderIds) {
      await prisma.order.update({
        where: { id: orderId },
        data: updateData
      });
    }
    
    // 通知フラグがオンで、発送済みステータスの場合はメール送信
    if (sendNotification && status === 'SHIPPED') {
      const orders = await prisma.order.findMany({
        where: { 
          id: { in: orderIds },
          notificationSent: false
        },
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
      
      // メール送信処理
      for (const order of orders) {
        const userEmail = order.user?.email || (order.shippingAddress as any)?.email;
        const userName = order.user?.name || (order.shippingAddress as any)?.name || 'お客様';
        
        if (userEmail) {
          try {
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
                <p>商品の到着まで今しばらくお待ちください。</p>
                <p>何かご不明な点がございましたら、お気軽にお問い合わせください。</p>
                <p>引き続きよろしくお願いいたします。</p>
              `
            });
            
            // 通知済みフラグを更新
            await prisma.order.update({
              where: { id: order.id },
              data: { notificationSent: true }
            });
          } catch (error) {
            console.error('Error sending email:', error);
          }
        }
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      updatedCount: orderIds.length, 
      message: `${orderIds.length}件の注文を「${getStatusLabel(status)}」に更新しました`
    });
  } catch (error) {
    console.error('Error updating order status:', error);
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