import {
	ButtonInteraction,
	ChatInputCommandInteraction,
	Collection,
	SlashCommandBuilder,
} from 'discord.js'
import { Group, Role, User } from './dbfn'

export * from 'discord.js'
declare module 'discord.js' {
	export interface Client {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		buttons: Collection<any, any>
		commands: Collection<string, IDiscordCommand>
	}
}

export interface IDiscordCommand {
	command: SlashCommandBuilder
	execute: (
		interaction: ChatInputCommandInteraction,
		dbuser: User,
		userRole: Role,
		dbGroup: Group | null,
	) => Promise<void>
	minimumToken: number | undefined
	tokenUsage: number | undefined
	permission: string | undefined
}
export interface IDiscordButton {
	name: string
	execute: (interaction: ButtonInteraction, args: string[]) => Promise<void>
}
export enum ApplicationCommandOptionType {
	Subcommand = 1,
	SubcommandGroup = 2,
	String = 3,
	Integer = 4,
	Boolean = 5,
	User = 6,
	Channel = 7,
	Role = 8,
	Mentionable = 9,
	Number = 10,
	Attachment = 11,
}
