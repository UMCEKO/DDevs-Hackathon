import { IDiscordButton } from '../fn/interfaces'
import { createPayment } from '../fn/payments'
import { ButtonInteraction } from 'discord.js'

module.exports = {
	name: 'buy-credits',
	execute: async (interaction: ButtonInteraction, args) => {
		//do something
		const userID = args[0]
		const payment = await createPayment('USD', 1, 1000, 'umutcevdetkocak@gmail.com')
		if (!payment.url) {
			console.log('URL is not present')
			return
		}
		let actionRow
		await interaction.user.send(
			"Here's your receipt. You will get your tokens once you complete the payment" + payment.url,
		)
	},
} as IDiscordButton
