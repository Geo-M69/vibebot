const { Events } = require('discord.js');
const logger = require('../utils/logger');

/**
 * Interaction event handler - Handles slash command interactions
 */
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Only handle chat input commands (slash commands)
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
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