import { StringSelectMenuBuilder } from '@discordjs/builders'
import {
	ActionRowBuilder,
	ButtonInteraction,
	ModalBuilder,
	StringSelectMenuOptionBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js'
import { IDiscordButton } from '../fn/interfaces'
import { createPayment } from '../fn/payments'

module.exports = {
	name: 'buy-credits',
	execute: async (interaction: ButtonInteraction, args) => {
		const modal = new ModalBuilder()
			.setTitle('Buy Credits')
			.setCustomId('buy-credits$' + interaction.user.id)

		const currencyInput = new StringSelectMenuBuilder()
			.setPlaceholder('USD')
			.setCustomId('currency')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('USD')
					.setValue('USD')
					.setDescription('USA Dollars.'),
				new StringSelectMenuOptionBuilder()
					.setLabel('EUR')
					.setValue('EUR')
					.setDescription("Europe's common currency."),
				new StringSelectMenuOptionBuilder()
					.setLabel('TRY')
					.setValue('TRY')
					.setDescription('Turkish Liras.'),
			)

		const quantityInput = new TextInputBuilder()
			.setCustomId('quantity')
			.setRequired(true)
			.setLabel('Quantity')
			.setStyle(TextInputStyle.Short)

		const emailInput = new TextInputBuilder()
			.setCustomId('email')
			.setRequired(false)
			.setLabel('Email')
			.setStyle(TextInputStyle.Short)

		const currencyRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(currencyInput)
		const quantityRow = new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput)
		const emailRow = new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput)

		// modal.addComponents(currencyRow)
		modal.addComponents(quantityRow)
		modal.addComponents(emailRow)

		interaction.showModal(modal)

		// const currency = interaction.fields.getTextInputValue('currency')
		// const quantity = interaction.fields.getTextInputValue('quantity')
		// const email = interaction.fields.getTextInputValue('email')

		//do something
		const payment = await createPayment('USD', 1, 0.001)
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
		return
	},
} as IDiscordButton
