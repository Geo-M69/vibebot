"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
// Import JS service for runtime compatibility
const goodbyeService = require('../../src/services/goodbyeService');
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('setgoodbye')
        .setDescription('Set a custom goodbye message for members who leave.')
        .addStringOption(option => option.setName('message')
        .setDescription('The goodbye message to set. Use {mention}, {user}, {guild} placeholders.')
        .setRequired(false))
        .addBooleanOption(option => option.setName('clear')
        .setDescription('Clear the goodbye message for this server.')
        .setRequired(false))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const guildId = interaction.guildId;
        const clear = interaction.options.getBoolean('clear');
        const message = interaction.options.getString('message');
        if (!guildId) {
            await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
            return;
        }
        if (clear) {
            goodbyeService.clearGoodbyeMessage(guildId);
            await interaction.reply({ content: 'Goodbye message cleared for this server.', ephemeral: true });
            return;
        }
        if (!message) {
            const current = goodbyeService.getGoodbyeMessage(guildId);
            await interaction.reply({ content: current ? `Current goodbye message:\n${current}` : 'No goodbye message set for this server.', ephemeral: true });
            return;
        }
        goodbyeService.setGoodbyeMessage(guildId, message);
        await interaction.reply({ content: `Goodbye message set to:\n${message}`, ephemeral: true });
    }
};
