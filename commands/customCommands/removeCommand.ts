import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, REST, Routes } from 'discord.js';
const customCommandService = require('../../src/services/customCommandService');
const config = require('../../src/config/botConfig');

export default {
    data: new SlashCommandBuilder()
        .setName('removecommand')
        .setDescription('Remove a custom command and deregister its guild slash command')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name of the custom command to remove')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction: ChatInputCommandInteraction) {
        const guildId = interaction.guildId;
        if (!guildId) {
            await interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
            return;
        }

        const name = interaction.options.getString('name', true).toLowerCase();

        customCommandService.removeCommand(guildId, name);

        let removedSlash = false;
        try {
            const rest = new REST({ version: '10' }).setToken(config.token);
            const guildCommands = await rest.get(Routes.applicationGuildCommands(config.clientId, guildId));
            if (Array.isArray(guildCommands)) {
                const cmd = guildCommands.find((c: any) => c.name === name);
                if (cmd) {
                    await rest.delete(Routes.applicationGuildCommand(config.clientId, guildId, cmd.id));
                    removedSlash = true;
                }
            }
        } catch (err) {
            console.error('Failed to deregister guild command', err);
        }

        await interaction.reply({ content: removedSlash ? `Custom command '/${name}' removed and deregistered.` : `Custom command '${name}' removed from storage.${removedSlash ? '' : ' (No guild slash command found/deregistered.)'}`, ephemeral: true });
    }
};
