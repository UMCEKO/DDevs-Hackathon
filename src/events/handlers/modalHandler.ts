import { ButtonInteraction, Events, ModalSubmitInteraction } from 'discord.js'

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction: ModalSubmitInteraction) {
		if (!interaction.isModalSubmit()) return
		const modal: { name: string; execute: (interaction: any) => Promise<undefined> } =
			interaction.client.buttons.get(interaction.customId)

		if (!modal) {
			console.error(`No buttons matching ${interaction.customId} was found.`)
			return
		}
		try {
			await modal.execute(interaction)
		} catch (error) {
			console.error(error)
		}
	},
}
