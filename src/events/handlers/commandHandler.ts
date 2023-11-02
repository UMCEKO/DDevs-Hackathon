import {ChatInputCommandInteraction, Events} from 'discord.js'
import {changeUserCredits, db, Group} from '../../fn/dbfn'
import {quickEmbedBuilder} from '../../fn/dcFn'
import {client} from '../../index'

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.isChatInputCommand()) return
		const data = client.commands.get(interaction.commandName)
		if (!data) {
			await interaction.reply({ content: 'Invalid command.', ephemeral: true })
			return
		}
		let creditUsed = false
		try {
			let dbgroup: Group | null = null
			if (interaction.guildId) dbgroup = await db.getGroup(interaction.guildId)
			const dbuser = await db.getUser(interaction.user.id)
			if (dbuser.banned) {
				await interaction.reply({
					content: 'You have been banned and cannot use any commands.',
					ephemeral: true,
				})
				return
			}
			const requiredCredits = data.minimumCreditRequirement || data.creditUsage || 0
			if (db.totalCredits(dbuser, dbgroup) < requiredCredits) {
				const embed = new quickEmbedBuilder(
					'Not enough credits!',
					'You do not have enough credits to use this command..' +
						'\nMinimum required: ' +
						requiredCredits +
						'\nHow much you have: ' +
						db.totalCredits(dbuser, dbgroup) +
						'\nYou will be given ' +
						dbuser.daily_credits +
						' credits everyday at 3 AM.',
					'error',
				)
				await interaction.reply({ embeds: [embed] })
				return
			}
			if (data.creditUsage) {
				await db.useCredits(dbuser, data.creditUsage, dbgroup, true)
				creditUsed = true
			}
			await data.execute(interaction, dbuser, dbgroup)
		} catch (error) {
			console.log(error)
			if (creditUsed) await changeUserCredits(interaction.user.id, data.creditUsage || 0)
			if (error !== 'CE') {
				try {
					const msg = {
						embeds: [
							new quickEmbedBuilder(
								'Error.',
								'There was an error whilst processing this command. You have been refunded your credits.',
								'error',
							),
						],
					}
					if (interaction.replied) {
						await interaction.followUp(msg)
					} else {
						await interaction.reply(msg)
					}
				} catch {
					await interaction.channel?.send({
						embeds: [new quickEmbedBuilder('Hata.', 'Hata.', 'error')],
					})
				}
			}
		}
	},
}
