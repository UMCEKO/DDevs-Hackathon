import { EmbedBuilder, Events, TextChannel } from 'discord.js'
import * as fs from 'fs'
import { sleep } from 'openai/core'
import * as path from 'path'
import { censorImage, generateImage } from '../fn/basicFn'
import { DatabaseParams } from '../fn/complexfn'
import { changeUserCredits, getNextPrompt, Queue, removeQueue } from '../fn/dbfn'
import { client, imagesPath } from '../index'

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute() {
		console.log('Bot is loaded up!')
		startImageGeneration(true).then(() => {
			console.log('Image gen has crashed on discord.')
			process.exit()
		})
	},
}
async function startImageGeneration(bool: boolean) {
	while (bool) {
		const prompt: Queue = await getNextPrompt()
		if (prompt) {
			if (prompt.platform !== 'discord') {
				await sleep(1000)
				continue
			}
			const guild = await client.guilds.fetch(prompt.groupid)
			const channel = (await guild.channels.fetch(prompt.chatID)) as TextChannel | null
			if (!channel) continue
			if (!channel.isTextBased) continue

			try {
				const dbParam = JSON.parse(Buffer.from(prompt.prompt).toString()) as DatabaseParams

				let img
				try {
					img = await generateImage(dbParam.imagineRequest)
					const fileName = Date.now()
					const user = await client.users.fetch(prompt.author)
					let image: Buffer
					let perf: number | undefined
					if (!channel.nsfw) {
						perf = performance.now()
						image = Buffer.from(await censorImage(img.image.toString('base64')), 'base64')
						perf = Math.floor(performance.now() - perf)
					} else {
						image = Buffer.from(img.image.toString('base64'), 'base64')
					}
					fs.writeFileSync(path.join(imagesPath, fileName + '.png'), image)
					await channel.send({
						embeds: [
							prompt.locale === 'tr'
								? new EmbedBuilder()
										.setTitle('İşte resminiz')
										.setAuthor({
											name: user.username,
											iconURL:
												user.avatarURL({
													size: 256,
													extension: 'png',
													forceStatic: true,
												}) || undefined,
										})
										.addFields([
											{
												name: 'Prompt',
												value: dbParam.positive_wos,
												inline: true,
											},
											{
												name: 'Negatif Prompt',
												value: dbParam.negative_wos || 'Yok',
												inline: true,
											},
											{
												name: 'Stil',
												value: dbParam.styles.toString() || 'Yok',
												inline: false,
											},
											{
												name: 'Seed',
												value: String(img.params.seed) || 'Yok',
												inline: true,
											},
											{
												name: 'Çözünürlük',
												value: img.params.width + 'x' + img.params.height,
												inline: true,
											},
											{
												name: 'Üretim süresi',
												value: Math.floor(img.time_took).toString() + 'ms',
												inline: true,
											},
											{
												name: 'Sansürleme süresi',
												value: perf ? perf.toString() + 'ms' : 'Yok',
											},
											{
												name: 'Sahibi',
												value: '<@' + prompt.author + '>',
											},
										])
										.setColor('#68ff00')
										.setImage('http://umceko.com:7836/images/generations/' + fileName + '.png')
								: new EmbedBuilder()
										.setTitle("Here's your image")
										.setAuthor({
											name: user.username,
											iconURL:
												user.avatarURL({
													size: 256,
													extension: 'png',
													forceStatic: true,
												}) || undefined,
										})
										.addFields([
											{
												name: 'Prompt',
												value: dbParam.positive_wos,
												inline: true,
											},
											{
												name: 'Negative Prompt',
												value: dbParam.negative_wos || 'None',
												inline: true,
											},
											{
												name: 'Styles',
												value: dbParam.styles.toString() || 'None',
												inline: false,
											},
											{
												name: 'Seed',
												value: String(img.params.seed) || 'None',
												inline: true,
											},
											{
												name: 'Resolution',
												value: img.params.width + 'x' + img.params.height,
												inline: true,
											},
											{
												name: 'Generation Time',
												value: Math.floor(img.time_took).toString() + 'ms',
												inline: true,
											},
											{
												name: 'Filtering Time',
												value: perf ? perf.toString() + 'ms' : 'None',
											},
											{
												name: 'Author',
												value: '<@' + prompt.author + '>',
											},
										])
										.setColor('#68ff00')
										.setImage('http://umceko.com:7836/images/generations/' + fileName + '.png'),
						],
					})
				} catch (e: any) {
					await changeUserCredits(prompt.author, client.commands.get('imagine')?.creditUsage || 0)

					if (e?.cause?.errno === -4078) {
						await channel.send({
							embeds: [
								new EmbedBuilder()
									.setTitle('Under Construction')
									.setDescription(
										`Image generation is currently undergoing maintenance. <@${prompt.author}>`,
									)
									.setColor('#ffc400'),
							],
						})
					} else {
						console.log(JSON.stringify(e, null, 2))
						console.log(e)
						await channel.send({
							embeds: [
								new EmbedBuilder()
									.setTitle('Error!')
									.setDescription(
										`Encountered an error whilst generating this image. <@${prompt.author}>`,
									)
									.setColor('#ff0000'),
							],
						})
					}
				}
			} catch (e) {
				console.log(e)
				await changeUserCredits(prompt.author, client.commands.get('imagine')?.creditUsage || 0)
			} finally {
				await removeQueue(prompt.queueID)
			}
		} else {
			await sleep(200)
		}
	}
}
