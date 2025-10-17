import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
const customCommandService = require('../../src/services/customCommandService');

export default {
    data: new SlashCommandBuilder()
        .setName('listcommands')
        .setDescription('List all custom commands for this server')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
            return;
        }

        const commands = customCommandService.getCommandsForGuild(guildId);
        const names = Object.keys(commands || {});
        if (names.length === 0) {
            await interaction.reply({ content: 'No custom commands set for this server.', ephemeral: true });
            return;
        }

        const list = names.map((n: string) => `/${n}`).join('\n');
        await interaction.reply({ content: `Custom commands for this server:\n${list}`, ephemeral: true });
    }
};
