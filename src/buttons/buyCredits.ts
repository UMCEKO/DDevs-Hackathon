import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

export const buyCreditsRow = new ActionRowBuilder<ButtonBuilder>()
export const buyCreditsBtn = new ButtonBuilder()
	.setLabel('Buy credits')
	.setStyle(ButtonStyle.Primary)
	.setCustomId('buy-credits')
