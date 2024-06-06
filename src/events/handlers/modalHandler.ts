import { Events, ModalSubmitInteraction } from 'discord.js'
import { IDiscordModal } from '../../fn/interfaces'

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction: ModalSubmitInteraction) {
		if (!interaction.isModalSubmit()) return
		const modal: IDiscordModal | undefined = interaction.client.modals.get(interaction.customId)

		if (!modal) {
			console.error(`No modals matching ${interaction.customId} was found.`)
			return
		}
		try {
			await modal.execute(interaction)
		} catch (error) {
			console.error(error)
		}
	},
}
