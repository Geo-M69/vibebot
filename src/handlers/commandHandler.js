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
     * Recursively collect .js files from a directory
     * @param {string} dir - Absolute path to directory
     * @returns {string[]} - Array of absolute file paths
     */
    _getJsFilesRecursive(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        let files = [];

        for (const entry of entries) {
            const res = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files = files.concat(this._getJsFilesRecursive(res));
            } else if (entry.isFile() && res.endsWith('.js')) {
                files.push(res);
            }
        }

        return files;
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

            // Collect .js files recursively so commands can be organized in subfolders
            const commandFiles = this._getJsFilesRecursive(commandsPath);

            if (commandFiles.length === 0) {
                logger.warn('No command files found');
                return;
            }

            let loadedCount = 0;

            for (const filePath of commandFiles) {
                const fileName = path.basename(filePath);

                try {
                    // Clear require cache for hot reloading in development
                    if (process.env.NODE_ENV === 'development') {
                        delete require.cache[require.resolve(filePath)];
                    }

                    const command = require(filePath);

                    if (this.validateCommand(command, fileName)) {
                        this.client.commands.set(command.data.name, command);
                        loadedCount++;
                        logger.debug(`Loaded command: ${command.data.name}`);
                    }
                } catch (error) {
                    logger.error(`Failed to load command ${fileName}`, error);
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
            // Search for the file recursively. Prefer filename match first
            const jsFiles = this._getJsFilesRecursive(commandsPath);
            let filePath = jsFiles.find(p => path.basename(p) === `${commandName}.js`);

            // Fallback: try to find a file that exports data.name === commandName
            if (!filePath) {
                for (const p of jsFiles) {
                    try {
                        const mod = require(p);
                        if (mod && mod.data && mod.data.name === commandName) {
                            filePath = p;
                            break;
                        }
                    } catch (e) {
                        // ignore errors while probing modules
                    }
                }
            }

            if (!filePath) {
                logger.warn(`Command file for ${commandName} not found in ${commandsPath}`);
                return false;
            }

            delete require.cache[require.resolve(filePath)];

            const newCommand = require(filePath);

            if (this.validateCommand(newCommand, path.basename(filePath))) {
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