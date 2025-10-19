import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';

export default {
	data: new SlashCommandBuilder()
		.setName('translate')
		.setDescription('Translate one of the last 5 messages in this channel via DeepL (interactive)'),

	async execute(interaction: ChatInputCommandInteraction) {
		const deeplKey = process.env.DEEPL;
		if (!deeplKey) {
			return interaction.reply({ content: 'DeepL API key is not configured. Please set DEEPL in the environment.', ephemeral: true });
		}

		const channel = interaction.channel;
		if (!channel || !channel.isTextBased()) {
			return interaction.reply({ content: 'This command can only be used in a text channel.', ephemeral: true });
		}

	// Build a preview and present 1-5 buttons to pick which message to translate

		try {
			// Fetch recent messages and prepare the last 5 with text content
			const fetched = await channel.messages.fetch({ limit: 50 });
			const messages = Array.from(fetched.values())
				.filter(m => typeof m.content === 'string' && m.content.trim().length > 0)
				.sort((a, b) => b.createdTimestamp - a.createdTimestamp)
				.slice(0, 5);

			if (messages.length === 0) {
				return interaction.reply({ content: 'No recent text messages found to translate.', ephemeral: true });
			}
			const preview = messages
				.map((m, i) => `${i + 1}. ${truncate(m.content)}`)
				.join('\n');

			const defaultLang = 'EN';

			const msgRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
				...messages.map((m, i) => new ButtonBuilder()
					.setCustomId(`translate:pick:${interaction.user.id}:${m.id}:${defaultLang}`)
					.setLabel(String(i + 1))
					.setStyle(ButtonStyle.Primary))
			);

			const langRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`translate:lang:${interaction.user.id}`)
					.setPlaceholder('Select target language')
					.addOptions(
						{ label: 'English (EN)', value: 'EN', description: 'Translate to English', default: true },
						{ label: 'English US (EN-US)', value: 'EN-US', description: 'Translate to English (US)' },
						{ label: 'English GB (EN-GB)', value: 'EN-GB', description: 'Translate to English (UK)' },
						{ label: 'Spanish (ES)', value: 'ES' },
						{ label: 'French (FR)', value: 'FR' },
						{ label: 'German (DE)', value: 'DE' },
						{ label: 'Italian (IT)', value: 'IT' },
						{ label: 'Portuguese (PT)', value: 'PT' },
						{ label: 'Portuguese BR (PT-BR)', value: 'PT-BR' },
						{ label: 'Dutch (NL)', value: 'NL' },
						{ label: 'Polish (PL)', value: 'PL' },
						{ label: 'Russian (RU)', value: 'RU' },
						{ label: 'Japanese (JA)', value: 'JA' },
						{ label: 'Chinese (ZH)', value: 'ZH' },
					)
			);

			const cancelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId(`translate:cancel:${interaction.user.id}`)
					.setLabel('Cancel')
					.setStyle(ButtonStyle.Secondary)
			);

			await interaction.reply({
				content: `Select a message to translate. Use the menu to choose language.\n${preview}`,
				components: [msgRow, langRow, cancelRow],
				ephemeral: true
			});
		} catch (err) {
			console.error('translateMessage error:', err);
			try {
				await interaction.reply({ content: 'An error occurred while preparing the translation list.', ephemeral: true });
			} catch {}
		}
	}
};

function truncate(text: string, max = 80): string {
	const t = text.replace(/\s+/g, ' ').trim();
	return t.length > max ? t.slice(0, max - 1) + '…' : t;
}

function clampDiscordMessage(text: string, max = 1900): string {
	if (text.length <= max) return text;
	return text.slice(0, max - 1) + '…';
}

