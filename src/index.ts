import {Client, Collection, GatewayIntentBits, REST, Routes} from 'discord.js'
import * as openai from 'openai'
import path from 'path'
import {getAllFileAbsDirs, getAllFileRelDirs} from './fn/basicFn'
import env from './fn/env'
import {IDiscordCommand} from './fn/interfaces'
import * as fs from "fs";


export const YildizAI = new openai.OpenAI({
	apiKey: env.GPT_API_KEY,
})

export const client = new Client({
	intents: [
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildVoiceStates,
	],
})
client.login(env.DC_TOKEN).catch((e) => console.log(e))
//discord command handler
client.commands = new Collection()
const dccommandsPath = path.join(__dirname, 'commands')
if (!fs.existsSync(dccommandsPath)) fs.mkdirSync(dccommandsPath)
const dccommandFiles = getAllFileRelDirs(dccommandsPath).filter(
	(file) => file.endsWith('.js') || file.endsWith('.ts'),
)
for (const file of dccommandFiles) {
	const filePath = path.join(dccommandsPath, file)
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const commandData: IDiscordCommand = require(filePath)
	console.log(commandData)
	if (!commandData.execute || !commandData.command?.name) {
		console.error(
			`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
		)
	} else {
		client.commands.set(commandData.command.name, commandData)
	}
}
const registerCommands = false
if (registerCommands) {
	const rest = new REST().setToken(env.DC_TOKEN)
	;(async () => {
		try {
			console.log(`Started refreshing ${client.commands.size} application (/) commands.`)
			// The put method is used to fully refresh all commands in the guild with the current set
			const data = (await rest.put(
				Routes.applicationCommands(env.CLIENT_ID),
				{ body: client.commands.map((value) => value.command) },
			)) as any[]
			console.log(`Successfully reloaded ${data.length} application (/) commands.`)
		} catch (error) {
			// And of course, make sure you catch and log any errors!
			console.error(error)
		}
	})()
}

//discord event handler
const dceventsPath = path.join(__dirname, 'events')
if (!fs.existsSync(dceventsPath)) fs.mkdirSync(dceventsPath)
const dceventFiles = getAllFileAbsDirs(dceventsPath).filter(
	(file) => file.endsWith('.js') || file.endsWith('.ts'),
)
for (const file of dceventFiles) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const event = require(file)
	console.log(event.name, event)
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args))
	} else {
		client.on(event.name, (...args) => event.execute(...args))
	}
}
//discord button handler
client.buttons = new Collection()
const buttonsPath = path.join(__dirname, 'buttons')
if (!fs.existsSync(buttonsPath)) fs.mkdirSync(buttonsPath)
const buttonFiles = getAllFileRelDirs(buttonsPath).filter(
	(file) => file.endsWith('.js') || file.endsWith('.ts'),
)
for (const file of buttonFiles) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const button = require(path.join(buttonsPath, file))
	if ('name' in button && 'execute' in button) {
		console.log(button.name, button)
		client.buttons.set(button.name, button)
	} else {
		console.log(`${file} is either missing name or execute property.`)
	}
}

export const imagesPath = path.join('D:\\generated-images')
