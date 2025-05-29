import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// 購入履歴の保存
export async function POST(request: NextRequest) {
    try {
        const { sessionId } = await request.json(); 

        if (!sessionId) {
            return NextResponse.json(
                { error: "Session ID is required" },
                { status: 400 }
            );
        }

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

        // 既存の購入履歴をチェック
        const existingPurchase = await prisma.purchase.findFirst({
            where: {
                userId: userId,
                fragranceId: fragranceId,
            },
        });

        if (!existingPurchase) {
            // 新しい購入履歴を作成
            const purchase = await prisma.purchase.create({
                data: {
                    userId: userId,
                    fragranceId: fragranceId,
                },
            });
            
            return NextResponse.json({ 
                success: true,
                purchase,
                message: "購入履歴を保存しました"
            });
        } else {
            return NextResponse.json({ 
                success: false,
                message: "すでに購入済みです" 
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