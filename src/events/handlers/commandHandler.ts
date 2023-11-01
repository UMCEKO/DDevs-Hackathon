import { ChatInputCommandInteraction, Events } from 'discord.js'
import { Group, changeUserToken, db } from '../../fn/dbfn'
import { quickEmbedBuilder } from '../../fn/dcFn'
import { client } from '../../index'

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction: ChatInputCommandInteraction) {
		if (!interaction.isChatInputCommand()) return
		const data = client.commands.get(interaction.commandName)
		if (!data) {
			await interaction.reply({ content: 'Invalid command.', ephemeral: true })
			return
		}
		let tokenUsed = false
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
			const userRole = await db.getRole(dbuser.role_id)
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
			const targetRole = await db.getRole(data.permission || 'user')
			const requiredTokens = data.minimumToken || data.tokenUsage || 0
			if (db.totalTokens(dbuser, dbgroup) < requiredTokens) {
				const embed = new quickEmbedBuilder(
					'Not enough credits!',
					'You do not have enough credits to use this command..' +
						'\nMinimum required: ' +
						requiredTokens +
						'\nHow much you have: ' +
						db.totalTokens(dbuser, dbgroup) +
						'\nYou will be given ' +
						userRole.daily_tokens +
						' tokens everyday at 3 AM.' +
						'\nDaha fazla token almak için özelden /profil yazıp aşağıda yer alan yönergeleri takip ediniz.',
					'error',
				)
				await interaction.reply({ embeds: [embed] })
				return
			}
			if (data.tokenUsage) {
				await db.useToken(dbuser, data.tokenUsage, dbgroup, true)
				tokenUsed = true
			}
			await data.execute(interaction, dbuser, userRole, dbgroup)
		} catch (error) {
			console.log(error)
			if (tokenUsed) await changeUserToken(interaction.user.id, data.tokenUsage || 0)
			if (error !== 'CE') {
				try {
					const msg = {
						embeds: [
							new quickEmbedBuilder(
								'Hata.',
								'Bu komut çalıştırılırken bir sorun oluştu. Tokenleriniz iade edildi',
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
