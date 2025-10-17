import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
// The welcome service is implemented in JS; import with require for compatibility
const welcomeService = require('../../src/services/welcomeService');

export default {
    data: new SlashCommandBuilder()
        .setName('setwelcome')
        .setDescription('Set a custom welcome message for new members.')
        .addStringOption(option =>
            option.setName('message')
                .setDescription('The welcome message to set. Use {mention}, {user}, {guild} placeholders.')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('clear')
                .setDescription('Clear the welcome message for this server.')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        const guildId = interaction.guildId;
        const clear = interaction.options.getBoolean('clear');
        const message = interaction.options.getString('message');

        if (!guildId) {
            await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
            return;
        }

        if (clear) {
            welcomeService.clearWelcomeMessage(guildId);
            await interaction.reply({ content: 'Welcome message cleared for this server.', ephemeral: true });
            return;
        }

        if (!message) {
            const current = welcomeService.getWelcomeMessage(guildId);
            await interaction.reply({ content: current ? `Current welcome message:\n${current}` : 'No welcome message set for this server.', ephemeral: true });
            return;
        }

        // Save the message for this guild
        welcomeService.setWelcomeMessage(guildId, message);
        await interaction.reply({ content: `Welcome message set to:\n${message}`, ephemeral: true });
    }
};
