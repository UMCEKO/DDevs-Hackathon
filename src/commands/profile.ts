import { EmbedBuilder, SlashCommandBuilder, User } from "discord.js";
import { User as DBUser, Group, Role, db } from "../fn/dbfn";
import { IDiscordCommand } from "../fn/interfaces";

module.exports = {
	command: new SlashCommandBuilder()
		.setName("profile")
		.setDescription("You can use this command to query your profile.")
		.setNSFW(false)
		.setDMPermission(true)
		.addMentionableOption((builder) =>
			builder
				.setRequired(false)
				.setName("user")
				.setDescription("The user that you want to check the profile of.")
		),
	minimumToken: undefined,
	tokenUsage: undefined,
	permission: "user",
	execute: async (interaction, dbuser, userRole, dbGroup) => {
		const targetUser = interaction.options.getUser("user");
		if (targetUser) {
			const tuser = await db.getUser(targetUser.id);
			const trole = await db.getRoleOf(targetUser.id);
			await interaction.reply({
				embeds: [
					getProfile(targetUser, tuser, trole, dbGroup, interaction.locale),
				],
			});
			return;
		} else {
			await interaction.reply({
				embeds: [
					getProfile(
						interaction.user,
						dbuser,
						userRole,
						dbGroup,
						interaction.locale
					),
				],
			});
			return;
		}
	},
} as IDiscordCommand;

const getProfile = (
	user: User,
	dbuser: DBUser,
	userRole: Role,
	dbgroup: Group | null,
	locale: string | undefined
): EmbedBuilder => {
	if (locale === "tr") {
		return new EmbedBuilder()
			.setTitle("My profile")
			.setColor("#00ffd4")
			.setThumbnail(user.avatarURL({ size: 1024, extension: "png" }))
			.addFields([
				{
					name: "Kullanıcı",
					value: `<@${user.id}>`,
					inline: false,
				},
				{
					name: "Rol",
					value: userRole.role_name,
					inline: false,
				},
				{
					name: "Grup token havuzu",
					value: dbgroup?.group_tokens.toLocaleString("tr-TR") || "0",
					inline: true,
				},
				{
					name: "Günlük token geliri",
					value: dbuser.daily_token_payout.toLocaleString("tr-TR"),
					inline: true,
				},
				{
					name: "Günlük tokenler",
					value: dbuser.daily_tokens.toLocaleString("tr-TR"),
					inline: true,
				},
				{
					name: "Paralı tokenler",
					value: dbuser.paid_tokens.toLocaleString("tr-TR"),
					inline: true,
				},
				{
					name: "Toplam tokenler",
					value: db.totalTokens(dbuser, dbgroup).toLocaleString("tr-TR"),
					inline: true,
				},
			]);
	} else {
		return new EmbedBuilder()
			.setTitle("My profile")
			.setColor("#00ffd4")
			.setThumbnail(user.avatarURL({ size: 1024, extension: "png" }))
			.addFields([
				{
					name: "User",
					value: `<@${user.id}>`,
					inline: false,
				},
				{
					name: "Role",
					value: userRole.role_name,
					inline: false,
				},
				{
					name: "Group token pool",
					value: dbgroup?.group_tokens.toLocaleString("en-US") || "0",
					inline: true,
				},
				{
					name: "Daily token income",
					value: dbuser.daily_token_payout.toLocaleString("en-US"),
					inline: true,
				},
				{
					name: "Daily Tokens",
					value: dbuser.daily_tokens.toLocaleString("en-US"),
					inline: true,
				},
				{
					name: "Paid tokens",
					value: dbuser.paid_tokens.toLocaleString("en-US"),
					inline: true,
				},
				{
					name: "Total tokens",
					value: db.totalTokens(dbuser, dbgroup).toLocaleString("en-US"),
					inline: true,
				},
			]);
	}
};
