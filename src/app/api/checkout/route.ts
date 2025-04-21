import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request, response: Response) {
    const { title, price, imageUrl, fragranceId, userId } = await request.json();
    console.log(title, price, imageUrl, fragranceId, userId);

    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            metadata: {
                fragranceId: fragranceId,
            },
            client_reference_id: userId,
            line_items: [
                {
                    price_data: {
                        currency: 'jpy',
                        product_data: {
                            name: title,
                            images: [imageUrl],
                        },
                        unit_amount: price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `http://localhost:3000/fragrance/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:3000`,
        });

        console.log("Created Stripe session:", session);
        return NextResponse.json({ checkout_url: session.url });
    } catch (err: any) {
        console.error("Error creating checkout session:", err);
        return NextResponse.json({ error: err.message });
    }
}