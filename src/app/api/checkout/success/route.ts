import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

// 注文情報の保存
export async function POST(request: NextRequest) {
    try {
        const { sessionId } = await request.json(); 

        if (!sessionId) {
            return NextResponse.json(
                { error: "Session ID is required" },
                { status: 400 }
            );
        }

        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        console.log("Session data:", session);

        const userId = session.client_reference_id;
        const fragranceId = session.metadata?.fragranceId;

        if (!userId || !fragranceId) {
            return NextResponse.json(
                { error: "Missing user ID or fragrance ID" },
                { status: 400 }
            );
        }

        // 既存の注文をチェック
        const existingOrder = await prisma.order.findFirst({
            where: {
                stripePaymentIntentId: session.payment_intent as string,
            },
        });

        if (!existingOrder) {
            // 商品情報を取得
            const product = await prisma.product.findUnique({
                where: { id: fragranceId }
            });
            
            if (!product) {
                return NextResponse.json(
                    { error: "Product not found" },
                    { status: 404 }
                );
            }
            
            // Orderを作成
            const order = await prisma.order.create({
                data: {
                    userId: userId,
                    total: product.price,
                    subtotal: product.price,
                    tax: 0,
                    shippingFee: 0,
                    shippingStatus: 'PENDING',
                    paymentStatus: 'COMPLETED',
                    paymentMethod: 'stripe',
                    stripePaymentIntentId: session.payment_intent as string,
                    orderItems: {
                        create: {
                            productId: fragranceId,
                            productName: product.name,
                            quantity: 1,
                            price: product.price,
                            isSample: false
                        }
                    }
                },
                include: {
                    orderItems: true
                }
            });
            
            // 下位互換性のためPurchase記録も作成
            await prisma.purchase.create({
                data: {
                    userId: userId,
                    fragranceId: fragranceId,
                },
            });
            
            return NextResponse.json({ 
                success: true,
                order,
                message: "注文を保存しました"
            });
        } else {
            return NextResponse.json({ 
                success: false,
                message: "すでに注文済みです" 
            });
        }           
    } catch (error) {
        console.error("Error processing checkout success:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}