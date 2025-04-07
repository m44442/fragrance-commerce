import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request, response: Response) {
    const { title, price, imageUrl } = await request.json();
    console.log(title, price, imageUrl);

    try {
        const session = await stripe.checkout.sessions.create({
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

        console.log(session);
        return NextResponse.json({ checkout_url: session.url });
    } catch (err: any) {
        return NextResponse.json({ error: err.message });
    }
}