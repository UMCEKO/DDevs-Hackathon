import {ButtonInteraction, Events} from 'discord.js'

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction: ButtonInteraction) {
		if (!interaction.isButton()) return
		const splitter = '$'
		const args = interaction.customId.split(splitter)
		const button: { name: string; execute: (interaction: any, args: any)=>Promise<undefined> } = interaction.client.buttons.get(args[0])
		if (!button) {
			console.error(`No buttons matching ${args[0]} was found.`)
			return
		}
		try {
			args.splice(0, 1)
			await button.execute(interaction, args)
		} catch (error) {
			console.error(error)
		}
	},
}
