import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	SlashCommandBuilder,
	User,
} from 'discord.js'
import { User as DBUser, Group, db } from '../fn/dbfn'
import { IDiscordCommand } from '../fn/interfaces'

module.exports = {
	command: new SlashCommandBuilder()
		.setName('profile')
		.setDescription('You can use this command to query your profile.')
		.setNSFW(false)
		.setDMPermission(true)
		.addMentionableOption((builder) =>
			builder
				.setRequired(false)
				.setName('user')
				.setDescription('The user that you want to check the profile of.'),
		),
	minimumCreditRequirement: undefined,
	creditUsage: undefined,
	permission: 'user',
	execute: async (interaction, dbuser, dbGroup) => {
		const buyCreditsRow = new ActionRowBuilder<ButtonBuilder>()
		const buyCreditsBtn = new ButtonBuilder()
			.setLabel('Buy credits')
			.setStyle(ButtonStyle.Primary)
			.setCustomId('buy-credits$' + interaction.user.id)
		buyCreditsRow.addComponents(buyCreditsBtn)

		const targetUser = interaction.options.getUser('user')
		if (targetUser) {
			const tuser = await db.getUser(targetUser.id)
			await interaction.reply({
				embeds: [getProfile(targetUser, tuser, dbGroup, interaction.locale)],
				components: [buyCreditsRow],
			})
			return
		} else {
			await interaction.reply({
				embeds: [getProfile(interaction.user, dbuser, dbGroup, interaction.locale)],
				components: [buyCreditsRow],
			})
			return
		}
	},
} as IDiscordCommand

const getProfile = (
	user: User,
	dbuser: DBUser,
	dbgroup: Group | null,
	locale: string | undefined,
): EmbedBuilder => {
	if (locale === 'tr') {
		return new EmbedBuilder()
			.setTitle('My profile')
			.setColor('#00ffd4')
			.setThumbnail(user.avatarURL({ size: 1024, extension: 'png' }))
			.addFields([
				{
					name: 'Kullanıcı',
					value: `<@${user.id}>`,
					inline: false,
				},
				{
					name: 'Grup kredi havuzu',
					value: dbgroup?.group_credits.toLocaleString('tr-TR') || '0',
					inline: true,
				},
				{
					name: 'Günlük kredi geliri',
					value: dbuser.daily_credit_payout.toLocaleString('tr-TR'),
					inline: true,
				},
				{
					name: 'Günlük krediler',
					value: dbuser.daily_credits.toLocaleString('tr-TR'),
					inline: true,
				},
				{
					name: 'Paralı krediler',
					value: dbuser.paid_credits.toLocaleString('tr-TR'),
					inline: true,
				},
				{
					name: 'Toplam krediler',
					value: db.totalCredits(dbuser, dbgroup).toLocaleString('tr-TR'),
					inline: true,
				},
			])
	} else {
		return new EmbedBuilder()
			.setTitle('My profile')
			.setColor('#00ffd4')
			.setThumbnail(user.avatarURL({ size: 1024, extension: 'png' }))
			.addFields([
				{
					name: 'User',
					value: `<@${user.id}>`,
					inline: false,
				},
				{
					name: 'Group credit pool',
					value: dbgroup?.group_credits.toLocaleString('en-US') || '0',
					inline: true,
				},
				{
					name: 'Daily credit income',
					value: dbuser.daily_credit_payout.toLocaleString('en-US'),
					inline: true,
				},
				{
					name: 'Daily credits',
					value: dbuser.daily_credits.toLocaleString('en-US'),
					inline: true,
				},
				{
					name: 'Paid credits',
					value: dbuser.paid_credits.toLocaleString('en-US'),
					inline: true,
				},
				{
					name: 'Total credits',
					value: db.totalCredits(dbuser, dbgroup).toLocaleString('en-US'),
					inline: true,
				},
			])
	}
}
