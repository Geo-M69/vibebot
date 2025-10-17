
import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, REST, Routes } from 'discord.js';
const customCommandService = require('../../src/services/customCommandService');
const config = require('../../src/config/botConfig');

function isValidCommandName(name: string) {
	// Slash command name rules: 1-32 chars, lowercase, no spaces, only a-z0-9-_.
	return /^[a-z0-9-_]{1,32}$/.test(name);
}

export default {
	data: new SlashCommandBuilder()
		.setName('addcommand')
		.setDescription('Create a custom text command for this server (prefix version: !addcommand)')
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Name of the custom command (no prefix)')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('response')
				.setDescription('Text response for the custom command. Supports {mention}, {user}, {guild}')
				.setRequired(true))
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	async execute(interaction: ChatInputCommandInteraction) {
		const guildId = interaction.guildId;
		if (!guildId) {
			await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
			return;
		}

		const name = interaction.options.getString('name', true).toLowerCase();
		const response = interaction.options.getString('response', true);

		if (!isValidCommandName(name)) {
			await interaction.reply({ content: 'Invalid command name. Use 1-32 lowercase letters, numbers, dashes or underscores (no spaces).', ephemeral: true });
			return;
		}

		// Save response in our storage
		customCommandService.setCommand(guildId, name, response);

		// Register a guild-scoped slash command so Discord shows it in the palette
		try {
			const rest = new REST({ version: '10' }).setToken(config.token);
			const cmdJson = new SlashCommandBuilder()
				.setName(name)
				.setDescription(`Custom command created by ${interaction.user.tag}`)
				.toJSON();

			await rest.post(Routes.applicationGuildCommands(config.clientId, guildId), { body: cmdJson });
		} catch (err) {
			// Non-fatal: log but continue
			console.error('Failed to register guild command', err);
		}

		await interaction.reply({ content: `Custom command '/${name}' created for this server.`, ephemeral: true });
	}
};

