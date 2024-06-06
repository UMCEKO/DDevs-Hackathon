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

module.exports = {
	name: 'buy-credits',
	execute: async (interaction: ButtonInteraction, args) => {
		const modal = new ModalBuilder().setTitle('Buy Credits').setCustomId('buy-credits')

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
			.setCustomId('quantity')

		const emailInput = new TextInputBuilder()
			.setCustomId('email')
			.setRequired(false)
			.setLabel('Email')
			.setStyle(TextInputStyle.Short)
			.setCustomId('email')

		// const currencyRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(currencyInput)
		const quantityRow = new ActionRowBuilder<TextInputBuilder>().addComponents(quantityInput)
		const emailRow = new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput)

		// modal.addComponents(currencyRow)
		modal.addComponents(quantityRow)
		modal.addComponents(emailRow)

		await interaction.showModal(modal)

		// const currency = interaction.fields.getTextInputValue('currency')
		// const quantity = interaction.fields.getTextInputValue('quantity')
		// const email = interaction.fields.getTextInputValue('email')

		//do something
	},
} as IDiscordButton
