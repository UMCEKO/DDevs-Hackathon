import {
	APIApplicationCommandOptionChoice,
	EmbedBuilder,
	SlashCommandBuilder,
	TextChannel,
} from 'discord.js'
import { imagine, SDXLStyles } from '../fn/complexfn'
import { IDiscordCommand } from '../fn/interfaces'
import { openai } from '../index'

interface optionifiedStyle {
	name: string
	value: string
}
function optionifyStyle(
	...styles: { name: string; prompt: string; negative_prompt: string }[]
): APIApplicationCommandOptionChoice<string>[] {
	const optionifiedStyleArr: optionifiedStyle[] = []
	for (const style of styles) {
		optionifiedStyleArr.push({
			name: style.name,
			value: style.name,
		})
	}
	return optionifiedStyleArr
}
module.exports = {
	command: new SlashCommandBuilder()
		.setName('imagine')
		.setDescription('Generate images using the power of AI!')
		.setNameLocalization('tr', 'resim-oluştur')
		.setDescriptionLocalization('tr', 'AI destekli resim oluşturma komudu.')
		.setNSFW(false)
		.setDMPermission(false)
		.addStringOption((builder) =>
			builder
				.setName('prompt')
				.setDescription('Description of the image that you want to generate.')
				.setNameLocalization('tr', 'prompt')
				.setDescriptionLocalization('tr', 'Çizdirmek istediğiniz resmin betimlemesi')
				.setRequired(true)
				.setMaxLength(1000),
		)
		.addStringOption((builder) =>
			builder
				.setName('negative-prompt')
				.setDescription('Things you want to avoid generating.')
				.setNameLocalization('tr', 'negatif-prompt')
				.setDescriptionLocalization('tr', 'Çizdirmekten kaçınmak istediğiniz şey.')
				.setRequired(false)
				.setMaxLength(1000),
		)
		.addStringOption((builder) =>
			builder
				.setName('model')
				.setDescription('Which model you want to use.')
				.setNameLocalization('tr', 'model')
				.setDescriptionLocalization('tr', 'Kullanmak istediğiniz yapay zeka modeli.')
				.setChoices(
					{ name: 'Overall best quality.', value: 'sdxl' },
					{ name: 'Anime model.', value: 'anime' },
				)
				.setRequired(false),
		)
		.addIntegerOption((builder) =>
			builder
				.setName('height')
				.setDescription('Sets the height of the image.')
				.setNameLocalization('tr', 'yükseklik')
				.setDescriptionLocalization('tr', 'Resmin yüksekliğini ayarlamınızı sağlar.')
				.setMinValue(100)
				.setMaxValue(1536)
				.setRequired(false),
		)
		.addIntegerOption((builder) =>
			builder
				.setName('width')
				.setDescription('Sets the width of the image.')
				.setNameLocalization('tr', 'genişlik')
				.setDescriptionLocalization('tr', 'Resmin genişliğini ayarlamanızı sağlar.')
				.setMinValue(100)
				.setMaxValue(1536)
				.setRequired(false),
		)
		.addIntegerOption((builder) =>
			builder
				.setName('seed')
				.setDescription('Sets the seed of the image.')
				.setNameLocalization('tr', 'seed')
				.setDescriptionLocalization('tr', "Resmin seed'ini ayarlamanızı sağlar.")
				.setMinValue(-1)
				.setRequired(false),
		)
		.addStringOption((builder) =>
			builder
				.setName('style')
				.setDescription('The style that the image should be drawn in.')
				.setNameLocalization('tr', 'stil')
				.setDescriptionLocalization('tr', 'Yapılacak resmin stili.')
				.addChoices(
					...optionifyStyle(
						SDXLStyles['sai-anime'],
						SDXLStyles['sai-cinematic'],
						SDXLStyles['sai-comic book'],
						SDXLStyles['sai-digital art'],
						SDXLStyles['sai-enhance'],
						SDXLStyles['sai-fantasy art'],
						SDXLStyles['sai-line art'],
						SDXLStyles['sai-lowpoly'],
						SDXLStyles['sai-origami'],
						SDXLStyles['sai-3d-model'],
						SDXLStyles['sai-pixel art'],
						SDXLStyles['sai-texture'],
						SDXLStyles['sai-neonpunk'],
						SDXLStyles['ads-advertising'],
						SDXLStyles['ads-food photography'],
						SDXLStyles['Logo Design'],
						SDXLStyles['Flat 2D Art'],
						SDXLStyles['Blueprint Schematic Drawing'],
						SDXLStyles['artstyle-graffiti'],
						SDXLStyles['misc-architectural'],
						SDXLStyles['game-minecraft'],
						SDXLStyles['game-gta'],
						SDXLStyles['Adorable 3D Character'],
						SDXLStyles['Action Figure'],
					),
				),
		),
	minimumCreditRequirement: undefined,
	creditUsage: 10000,
	permission: 'user',
	execute: async (interaction, dbuser, dbGroup) => {
		if (!interaction.channel?.isTextBased()) {
			await interaction.reply('Channel not text based.')
			return
		}
		const model: 'anime' | 'sdxl' =
			(interaction.options.getString('model') as 'anime' | 'sdxl' | null) || 'sdxl'
		const negativePr = interaction.options.getString('negative-prompt') || ''
		const positivePr = interaction.options.getString('prompt', true)
		const seed = interaction.options.getInteger('seed') || -1
		const widthInput = interaction.options.getInteger('width')
		const heightInput = interaction.options.getInteger('height')
		const style = interaction.options.getString('style')
		let aspect: {
			height: number
			width: number
		}
		if (model === 'anime') {
			aspect = {
				height: heightInput ? Math.min(768, heightInput) : 768,
				width: widthInput ? Math.min(768, widthInput) : 512,
			}
		} else {
			aspect = {
				height: heightInput ? Math.min(1536, heightInput) : 1024,
				width: widthInput ? Math.min(1536, widthInput) : 1024,
			}
			if (aspect.width * aspect.height > 1024 * 1024) {
				const ar = aspect.width / aspect.height
				aspect = {
					width: 1024 * ar,
					height: 1024 / ar,
				}
			}
		}
		const channel = interaction.channel as TextChannel
		// let det = tinyld.detect(positivePr, {only: ["tr", "en"]})
		// if (!["en", ""].includes(det)){
		//     await interaction.reply({embeds: [
		//         interaction.locale === "tr"?
		//             new EmbedBuilder()
		//                 .setColor("#de1717")
		//                 .setTitle("Hatalı girdi!")
		//                 .setDescription("Girdiğiniz promptun ingilizce olması lazımdır!")
		//             :
		//             new EmbedBuilder()
		//                 .setColor("#de1717")
		//                 .setTitle("Invalid input!")
		//                 .setDescription("You have to input a prompt that is english!")
		//     ]})
		//     throw "CE"
		// }
		if (!channel.nsfw) {
			const modResponse = await openai.moderations.create({
				model: 'text-moderation-latest',
				input: positivePr,
			})
			if (modResponse.results[0].category_scores.sexual > 0.3) {
				await interaction.reply({
					embeds: [
						interaction.locale === 'tr'
							? new EmbedBuilder()
									.setColor('#de1717')
									.setTitle('Bu kanalda uygunsuz içerik çizdiremezsiniz!')
									.setDescription('10000 kredi ceza yediniz!')
							: new EmbedBuilder()
									.setColor('#de1717')
									.setTitle('You cannot draw this kind of image on this channel!')
									.setDescription('You have recieved a penalty of 10000 credits!'),
					],
					ephemeral: true,
				})
				return
			}
		}
		const result = await imagine(
			{
				aspect: aspect,
				positivePrompt: positivePr,
				negativePrompt: negativePr,
				anime: model === 'anime',
				seed: seed,
				styles: style ? [style] : undefined,
				lossless: true,
				locale: interaction.locale,
			},
			interaction.user.id,
			interaction.channel.id,
			'0',
			interaction.guild?.id || null,
		)
		if (result.code === 0) {
			await interaction.reply({
				embeds: [
					interaction.locale === 'tr'
						? new EmbedBuilder()
								.setTitle('Resminiz oluşturuluyor!')
								.setDescription('Lütfen biraz bekleyin!')
								.setColor('#54ff00')
						: new EmbedBuilder()
								.setTitle('Your image is generating!')
								.setDescription('Hang on a little!')
								.setColor('#54ff00'),
				],
			})
		} else if (result.code === 1) {
			await interaction.reply({
				embeds: [
					interaction.locale === 'tr'
						? new EmbedBuilder()
								.setTitle('Resminiz çizim sırasına eklendi!')
								.setDescription(`Önünüzde ${result.queueSize} kişi var!`)
								.setColor('#00ffd0')
						: new EmbedBuilder()
								.setTitle('Your image has been added to the queue!')
								.setDescription(`There are ${result.queueSize} people in the queue!`)
								.setColor('#00ffd0'),
				],
			})
		} else if (result.code === 2) {
			await interaction.reply({
				embeds: [
					interaction.locale === 'tr'
						? new EmbedBuilder()
								.setTitle('Geçersiz stil girdiniz!')
								.setDescription('Geçerli stillerin listesi:\n' + Object.keys(SDXLStyles).join('\n'))
						: new EmbedBuilder()
								.setTitle('You have entered an invalid style!')
								.setDescription('List of valid styles:\n' + Object.keys(SDXLStyles).join('\n')),
				],
				ephemeral: true,
			})
		} else {
			console.log(result)
			await interaction.reply({
				embeds: [
					interaction.locale === 'tr'
						? new EmbedBuilder()
								.setTitle('Bu istek işlenirken bir sorun oluştu!')
								.setDescription(`Lütfen destek için "vmut" kullanıcısna ulaşın.`)
								.setColor('#ffe200')
						: new EmbedBuilder()
								.setTitle('An error occured whilst processing your request!')
								.setDescription(`Please contact "vmut" for support.`)
								.setColor('#ffe200'),
				],
				ephemeral: true,
			})
			throw 'CE'
		}
	},
} as IDiscordCommand
