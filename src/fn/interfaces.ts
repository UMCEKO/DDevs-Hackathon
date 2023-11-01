import {Group, Role, User} from "./dbfn";
import {ButtonInteraction, ChatInputCommandInteraction, CommandInteraction, SlashCommandBuilder} from "discord.js";

export interface IDiscordCommand {
    command: SlashCommandBuilder,
    execute: (interaction: ChatInputCommandInteraction, dbuser: User, userRole: Role, dbGroup: Group | null) => Promise<void>
    minimumToken: number | undefined
    tokenUsage: number | undefined
    permission: string | undefined
}
export interface IDiscordButton {
    name: string,
    execute: (interaction: ButtonInteraction, args: string[])=>Promise<void>
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
    Attachment = 11
}
