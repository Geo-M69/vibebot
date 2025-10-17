const { Events } = require('discord.js');
const logger = require('../utils/logger');
const customCommandService = require('../services/customCommandService');
const { REST, Routes } = require('discord.js');
const config = require('../config/botConfig');
const { formatMessage } = require('../utils/formatMessage');

/**
 * Interaction event handler - Handles slash command interactions
 */
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle button interactions for confirmation flows
        if (interaction.isButton && interaction.customId) {
            try {
                const id = interaction.customId;
                // Expected formats: removecmd:{userId}:{name}, removecancel:{userId}:{name}, removeall:{userId}, removeallcancel:{userId}
                if (id.startsWith('removecmd:') || id.startsWith('removecancel:')) {
                    const [, userId, name] = id.split(':');
                    if (interaction.user.id !== userId) {
                        await interaction.reply({ content: 'You are not authorized to confirm this action.', ephemeral: true });
                        return;
                    }

                    if (id.startsWith('removecancel:')) {
                        await interaction.update({ content: `Removal cancelled for '/${name}'.`, components: [] });
                        return;
                    }

                    // Proceed to remove command and deregister slash command
                    const guildId = interaction.guildId;
                    customCommandService.removeCommand(guildId, name);

                    try {
                        const rest = new REST({ version: '10' }).setToken(config.token);
                        const guildCommands = await rest.get(Routes.applicationGuildCommands(config.clientId, guildId));
                        if (Array.isArray(guildCommands)) {
                            const cmd = guildCommands.find(c => c.name === name);
                            if (cmd) await rest.delete(Routes.applicationGuildCommand(config.clientId, guildId, cmd.id));
                        }
                    } catch (err) {
                        logger.error('Failed to deregister guild command', err);
                    }

                    await interaction.update({ content: `Custom command '/${name}' removed.`, components: [] });
                    return;
                }

                if (id.startsWith('removeall:') || id.startsWith('removeallcancel:')) {
                    const [, userId] = id.split(':');
                    if (interaction.user.id !== userId) {
                        await interaction.reply({ content: 'You are not authorized to confirm this action.', ephemeral: true });
                        return;
                    }

                    if (id.startsWith('removeallcancel:')) {
                        await interaction.update({ content: 'Removal cancelled for all custom commands.', components: [] });
                        return;
                    }

                    const guildId = interaction.guildId;
                    // Remove all stored commands
                    const commands = customCommandService.getCommandsForGuild(guildId);
                    const names = Object.keys(commands || {});
                    names.forEach(n => customCommandService.removeCommand(guildId, n));

                    // Attempt to deregister guild slash commands that match
                    try {
                        const rest = new REST({ version: '10' }).setToken(config.token);
                        const guildCommands = await rest.get(Routes.applicationGuildCommands(config.clientId, guildId));
                        if (Array.isArray(guildCommands)) {
                            for (const cmd of guildCommands) {
                                if (names.includes(cmd.name)) {
                                    await rest.delete(Routes.applicationGuildCommand(config.clientId, guildId, cmd.id));
                                }
                            }
                        }
                    } catch (err) {
                        logger.error('Failed to deregister guild commands', err);
                    }

                    await interaction.update({ content: `All custom commands removed for this server.`, components: [] });
                    return;
                }
            } catch (err) {
                logger.error('Error handling button interaction', err);
                try { await interaction.reply({ content: 'An error occurred while processing the action.', ephemeral: true }); } catch (e) {}
            }
        }

        // Only handle chat input commands (slash commands)
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            // Try to serve dynamic custom commands created per-guild
            try {
                const guildId = interaction.guildId;
                if (guildId) {
                    const stored = await customCommandService.getCommand(guildId, interaction.commandName);
                    if (stored) {
                        const output = formatMessage(stored, { userTag: interaction.user.tag, userId: interaction.user.id, guildName: interaction.guild ? interaction.guild.name : '' });

                        await interaction.reply({ content: output });
                        return;
                    }
                }
            } catch (err) {
                logger.error('Error handling dynamic command', err);
            }

            logger.warn(`Unknown command executed: ${interaction.commandName}`);
            return;
        }

        try {
            // Log command usage for analytics
            logCommandUsage(interaction);

            // Execute the command
            await command.execute(interaction);

            logger.debug(`Command ${interaction.commandName} executed successfully by ${interaction.user.tag}`);
        } catch (error) {
            logger.error(`Error executing command ${interaction.commandName}`, error);
            
            // Send error response to user
            await handleCommandError(interaction, error);
        }
    },
};

/**
 * Log command usage for analytics
 * @param {CommandInteraction} interaction - The command interaction
 */
function logCommandUsage(interaction) {
    const { commandName, user, guild } = interaction;
    const guildInfo = guild ? `${guild.name} (${guild.id})` : 'DM';
    
    logger.info(`Command executed: ${commandName} by ${user.tag} (${user.id}) in ${guildInfo}`);
}

/**
 * Handle command execution errors
 * @param {CommandInteraction} interaction - The command interaction
 * @param {Error} error - The error that occurred
 */
async function handleCommandError(interaction, error) {
    const errorMessage = 'There was an error while executing this command!';
    const errorDetails = process.env.NODE_ENV === 'development' ? `\n\`\`\`${error.message}\`\`\`` : '';

    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ 
                content: errorMessage + errorDetails, 
                ephemeral: true 
            });
        } else {
            await interaction.reply({ 
                content: errorMessage + errorDetails, 
                ephemeral: true 
            });
        }
    } catch (followUpError) {
        logger.error('Failed to send error message to user', followUpError);
    }
}