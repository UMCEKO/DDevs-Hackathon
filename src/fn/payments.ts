import { Stripe } from 'stripe'
import env from './env'

const STRIPE_SECRET_KEY =
	env.TESTING === true ? env.STRIPE_DEV_SECRET_KEY : env.STRIPE_LIVE_SECRET_KEY

const paymentClient = new Stripe(STRIPE_SECRET_KEY)
type Currency = 'USD' | 'EUR' | 'TRY'

export async function createPayment(currency: Currency, amount: number, email: string) {
	return await paymentClient.checkout.sessions.create({
		payment_method_types: ['card', 'paypal'],
		customer_email: email,
		line_items: [
			{
				price_data: {
					currency,
					product_data: {
						name: `${amount * 1000} Paid Tokens`,
						images: ['https://i.ibb.co/hRXKcgF/1699026666071.png'],
					},
					unit_amount: amount, // amount in cents
				},
				quantity: 1,
			},
		],
		mode: 'payment',
		allow_promotion_codes: true,
		success_url: 'https://umceko.github.io/success',
		cancel_url: 'https://umceko.github.io/unsuccess',
		after_expiration: { recovery: { allow_promotion_codes: true, enabled: true } },
	})
}
