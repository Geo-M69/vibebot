"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customCommandService = require('../../src/services/customCommandService');
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('removeallcommands')
        .setDescription('Remove all custom commands for this server (confirmation required)')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
            return;
        }
        const userId = interaction.user.id;
        const confirmId = `removeall:${userId}`;
        const cancelId = `removeallcancel:${userId}`;
        const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(confirmId).setLabel('Confirm Remove All').setStyle(discord_js_1.ButtonStyle.Danger), new discord_js_1.ButtonBuilder().setCustomId(cancelId).setLabel('Cancel').setStyle(discord_js_1.ButtonStyle.Secondary));
        await interaction.reply({ content: `Are you sure you want to remove ALL custom commands for this server? This action cannot be undone.`, components: [row], ephemeral: true });
    }
};
