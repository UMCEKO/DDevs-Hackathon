import { IDiscordModal } from '../fn/interfaces'
import { createPayment } from '../fn/payments'

const tokensPerUSD = 100000
const minimumTransactionAmt = 1
const minimumTokenAmount = tokensPerUSD

module.exports = {
	name: 'buy-credits',
	execute: async (interaction) => {
		const amount = Number(interaction.fields.getField('quantity').value)
		const mail = String(interaction.fields.getField('email').value)
		if (amount < minimumTokenAmount || Number.isNaN(amount)) {
			await interaction.reply({
				content: `You have to get at least ${minimumTokenAmount} tokens in order to buy tokens, which is ${minimumTransactionAmt} dollars.`,
				ephemeral: true,
			})
			return
		}

		const payment = await createPayment('USD', Math.ceil(amount / (tokensPerUSD / 100)), mail)
		if (!payment.url) {
			console.error('URL is not present')
			await interaction.reply({
				content: 'Something went wrong here. Try again please.',
				ephemeral: true,
			})
			return
		}
		await interaction.reply({
			content: `Here's your receipt. You will get your tokens once you complete the payment: ${payment.url}`,
			ephemeral: true,
		})
	},
} as IDiscordModal
