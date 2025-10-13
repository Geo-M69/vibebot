const { REST, Routes } = require('discord.js');
const { Client, GatewayIntentBits } = require('discord.js');
const CommandHandler = require('./handlers/commandHandler');
const config = require('./config/botConfig');
const logger = require('./utils/logger');

/**
 * Standalone script for deploying slash commands to Discord
 * Run this script separately when commands are added/modified
 */

async function deployCommands() {
    try {
        // Validate configuration
        config.validateConfig();

        logger.info('Starting command deployment...');

        // Create a temporary client to load commands
        const tempClient = new Client({ 
            intents: [GatewayIntentBits.Guilds] 
        });

        const commandHandler = new CommandHandler(tempClient);
        await commandHandler.loadCommands();

        const commands = commandHandler.getCommandsForDeployment();

        if (commands.length === 0) {
            logger.warn('No commands found to deploy');
            return;
        }

        const rest = new REST({ version: '10' }).setToken(config.token);

        logger.info(`Started refreshing ${commands.length} application slash command(s)...`);

        // Deploy commands globally
        const data = await rest.put(
            Routes.applicationCommands(config.clientId),
            { body: commands },
        );

        logger.info(`Successfully reloaded ${data.length} application slash command(s)!`);
        
        // Log deployed commands
        data.forEach(command => {
            logger.debug(`Deployed: ${command.name} - ${command.description}`);
        });

    } catch (error) {
        logger.error('Error deploying commands', error);
        process.exit(1);
    }
}

/**
 * Deploy commands to a specific guild (for testing)
 * @param {string} guildId - The guild ID to deploy to
 */
async function deployGuildCommands(guildId) {
    try {
        config.validateConfig();

        if (!guildId) {
            throw new Error('Guild ID is required for guild-specific deployment');
        }

        logger.info(`Starting guild command deployment for guild ${guildId}...`);

        const tempClient = new Client({ 
            intents: [GatewayIntentBits.Guilds] 
        });

        const commandHandler = new CommandHandler(tempClient);
        await commandHandler.loadCommands();

        const commands = commandHandler.getCommandsForDeployment();

        if (commands.length === 0) {
            logger.warn('No commands found to deploy');
            return;
        }

        const rest = new REST({ version: '10' }).setToken(config.token);

        const data = await rest.put(
            Routes.applicationGuildCommands(config.clientId, guildId),
            { body: commands },
        );

        logger.info(`Successfully deployed ${data.length} command(s) to guild ${guildId}!`);
    } catch (error) {
        logger.error('Error deploying guild commands', error);
        process.exit(1);
    }
}

// Handle command line arguments
const args = process.argv.slice(2);
const isGuildDeploy = args.includes('--guild');
const guildIndex = args.indexOf('--guild');
const guildId = isGuildDeploy && guildIndex !== -1 ? args[guildIndex + 1] : null;

// Execute deployment
if (require.main === module) {
    if (isGuildDeploy) {
        deployGuildCommands(guildId);
    } else {
        deployCommands();
    }
}

module.exports = {
    deployCommands,
    deployGuildCommands
};