import { Stripe } from 'stripe'
import env from './env'

const paymentClient = new Stripe(env.STRIPE_SECRET_KEY)
type Currency = 'USD' | 'EUR' | 'TRY'

export async function createPayment(
	currency: Currency,
	quantity: number,
	centAmountForToken: number,
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
		success_url: 'https://umceko.github.io/success',
		cancel_url: 'https://example.com/cancel',
		after_expiration: { recovery: { allow_promotion_codes: true, enabled: true } },
	})
}
