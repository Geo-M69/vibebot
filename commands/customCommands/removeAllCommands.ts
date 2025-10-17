import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
const customCommandService = require('../../src/services/customCommandService');

export default {
    data: new SlashCommandBuilder()
        .setName('removeallcommands')
        .setDescription('Remove all custom commands for this server (confirmation required)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
            return;
        }

        const userId = interaction.user.id;
        const confirmId = `removeall:${userId}`;
        const cancelId = `removeallcancel:${userId}`;

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setCustomId(confirmId).setLabel('Confirm Remove All').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(cancelId).setLabel('Cancel').setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ content: `Are you sure you want to remove ALL custom commands for this server? This action cannot be undone.`, components: [row], ephemeral: true });
    }
};
