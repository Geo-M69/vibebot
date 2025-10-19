"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customCommandService = require('../../src/services/customCommandService');
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('listcommands')
        .setDescription('List all custom commands for this server')
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
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
        const list = names.map((n) => `/${n}`).join('\n');
        await interaction.reply({ content: `Custom commands for this server:\n${list}`, ephemeral: true });
    }
};
