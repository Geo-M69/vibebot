const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

/**
 * Command handler for loading and managing Discord slash commands
 * @module commandHandler
 */

class CommandHandler {
    constructor(client) {
        this.client = client;
        this.client.commands = new Collection();
    }

    /**
     * Load all commands from the commands directory
     * @param {string} commandsPath - Path to the commands directory
     */
    async loadCommands(commandsPath = path.join(process.cwd(), 'commands')) {
        try {
            if (!fs.existsSync(commandsPath)) {
                logger.warn(`Commands directory not found: ${commandsPath}`);
                return;
            }

            const commandFiles = fs.readdirSync(commandsPath)
                .filter(file => file.endsWith('.js'));

            if (commandFiles.length === 0) {
                logger.warn('No command files found');
                return;
            }

            let loadedCount = 0;

            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                
                try {
                    // Clear require cache for hot reloading in development
                    if (process.env.NODE_ENV === 'development') {
                        delete require.cache[require.resolve(filePath)];
                    }

                    const command = require(filePath);

                    if (this.validateCommand(command, file)) {
                        this.client.commands.set(command.data.name, command);
                        loadedCount++;
                        logger.debug(`Loaded command: ${command.data.name}`);
                    }
                } catch (error) {
                    logger.error(`Failed to load command ${file}`, error);
                }
            }

            logger.info(`Successfully loaded ${loadedCount} command(s)`);
        } catch (error) {
            logger.error('Error loading commands', error);
        }
    }

    /**
     * Validate a command object
     * @param {Object} command - The command object to validate
     * @param {string} filename - The filename for logging purposes
     * @returns {boolean} - Whether the command is valid
     */
    validateCommand(command, filename) {
        if (!command.data || !command.execute) {
            logger.warn(`Command at ${filename} is missing required 'data' or 'execute' property`);
            return false;
        }

        if (typeof command.execute !== 'function') {
            logger.warn(`Command at ${filename} execute property is not a function`);
            return false;
        }

        return true;
    }

    /**
     * Get all loaded commands for deployment
     * @returns {Array} Array of command data for Discord API
     */
    getCommandsForDeployment() {
        return Array.from(this.client.commands.values())
            .map(command => command.data.toJSON());
    }

    /**
     * Reload a specific command
     * @param {string} commandName - Name of the command to reload
     * @param {string} commandsPath - Path to the commands directory
     */
    async reloadCommand(commandName, commandsPath = path.join(process.cwd(), 'commands')) {
        const command = this.client.commands.get(commandName);
        
        if (!command) {
            logger.warn(`Command ${commandName} not found`);
            return false;
        }

        try {
            const filePath = path.join(commandsPath, `${commandName}.js`);
            delete require.cache[require.resolve(filePath)];
            
            const newCommand = require(filePath);
            
            if (this.validateCommand(newCommand, `${commandName}.js`)) {
                this.client.commands.set(newCommand.data.name, newCommand);
                logger.info(`Successfully reloaded command: ${commandName}`);
                return true;
            }
            
            return false;
        } catch (error) {
            logger.error(`Failed to reload command ${commandName}`, error);
            return false;
        }
    }
}

module.exports = CommandHandler;