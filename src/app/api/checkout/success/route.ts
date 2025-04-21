import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

//購入履歴の保存
export async function POST(request: Request, response: Response) {
    const { sessionId } = await request.json(); 

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        console.log("Session data:", session);

        const userId = session.client_reference_id;
        const fragranceId = session.metadata?.fragranceId;

        const exitingPurchase = await prisma.purchase.findFirst({
            where: {
                userId: session.client_reference_id!,
                fragranceId: session.metadata?.fragranceId!,
            },
        });
        if (!exitingPurchase) {
             const purchase = await prisma.purchase.create({
                data: {
                    userId: session.client_reference_id!,
                    fragranceId: session.metadata?.fragranceId!,
                },
        });
        return NextResponse.json({ purchase });
        }  else {
            return NextResponse.json({ message: "すでに購入済みです" });
        }           
    } catch (err) {
        return NextResponse.json(err);
    }
}