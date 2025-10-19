"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const customCommandService = require('../../src/services/customCommandService');
const config = require('../../src/config/botConfig');
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('removecommand')
        .setDescription('Remove a custom command and deregister its guild slash command')
        .addStringOption(option => option.setName('name')
        .setDescription('Name of the custom command to remove')
        .setRequired(true))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
            return;
        }
        const name = interaction.options.getString('name', true).toLowerCase();
        customCommandService.removeCommand(guildId, name);
        let removedSlash = false;
        try {
            const rest = new discord_js_1.REST({ version: '10' }).setToken(config.token);
            const guildCommands = await rest.get(discord_js_1.Routes.applicationGuildCommands(config.clientId, guildId));
            if (Array.isArray(guildCommands)) {
                const cmd = guildCommands.find((c) => c.name === name);
                if (cmd) {
                    await rest.delete(discord_js_1.Routes.applicationGuildCommand(config.clientId, guildId, cmd.id));
                    removedSlash = true;
                }
            }
        }
        catch (err) {
            console.error('Failed to deregister guild command', err);
        }
        await interaction.reply({ content: removedSlash ? `Custom command '/${name}' removed and deregistered.` : `Custom command '${name}' removed from storage.${removedSlash ? '' : ' (No guild slash command found/deregistered.)'}`, ephemeral: true });
    }
};
