import env from './env'
import { Stripe } from 'stripe'

const paymentClient = new Stripe(env.STRIPE_SECRET_KEY)

export async function createPayment(
	currency: string,
	quantity: number,
	centAmountForToken: number,
	customer_email: string,
) {
	return await paymentClient.checkout.sessions.create({
		payment_method_types: ['card', 'paypal'],
		line_items: [
			{
				price_data: {
					currency,
					product_data: {
						name: 'Paid Token',
						images: ['https://i.ibb.co/hRXKcgF/1699026666071.png'],
					},
					unit_amount: centAmountForToken, // amount in cents
				},
				quantity,
			},
		],
		mode: 'payment',
		allow_promotion_codes: true,
		success_url: 'https://example.com/success',
		cancel_url: 'https://example.com/cancel',
		customer_email,
	})
}
