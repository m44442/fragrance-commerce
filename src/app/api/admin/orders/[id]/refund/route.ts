import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { nextAuthOptions } from '@/lib/next-auth/options';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(nextAuthOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reason } = await request.json();

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ 
        error: '返金理由は必須です' 
      }, { status: 400 });
    }

    // 注文の存在確認
    const order = await prisma.order.findUnique({
      where: { id: params.id },
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

    if (!order) {
      return NextResponse.json({ error: '注文が見つかりません' }, { status: 404 });
    }

    // 返金可能な状態かチェック
    if (order.status === 'refunded') {
      return NextResponse.json({ 
        error: 'この注文は既に返金済みです' 
      }, { status: 400 });
    }

    if (order.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'キャンセル済みの注文は返金できません' 
      }, { status: 400 });
    }

    if (!order.stripePaymentIntentId) {
      return NextResponse.json({ 
        error: '決済情報が見つからないため返金できません' 
      }, { status: 400 });
    }

    try {
      // Stripeで返金処理
      const refund = await stripe.refunds.create({
        payment_intent: order.stripePaymentIntentId,
        amount: order.totalAmount, // 全額返金
        reason: 'requested_by_customer',
        metadata: {
          orderId: order.id,
          adminReason: reason,
          adminUserId: session.user.id
        }
      });

      // データベースを更新
      const updatedOrder = await prisma.order.update({
        where: { id: params.id },
        data: { 
          status: 'refunded',
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
        }
      });

      // 返金記録を作成
      await prisma.$executeRaw`
        INSERT INTO "Refund" ("id", "orderId", "amount", "reason", "stripeRefundId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), ${order.id}, ${order.totalAmount}, ${reason}, ${refund.id}, NOW(), NOW())
      `;

      // TODO: 返金通知メールの送信（将来実装予定）
      console.log(`Refund processed for order ${order.id}, notification email should be sent`);

      return NextResponse.json({
        order: updatedOrder,
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status
        }
      });

    } catch (stripeError: any) {
      console.error('Stripe refund error:', stripeError);
      
      // Stripe固有のエラーハンドリング
      if (stripeError.type === 'StripeCardError') {
        return NextResponse.json({ 
          error: 'カードエラーのため返金できませんでした' 
        }, { status: 400 });
      } else if (stripeError.type === 'StripeInvalidRequestError') {
        return NextResponse.json({ 
          error: '無効なリクエストです。決済情報を確認してください' 
        }, { status: 400 });
      } else {
        return NextResponse.json({ 
          error: '返金処理中にエラーが発生しました' 
        }, { status: 500 });
      }
    }

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}