const { Client, GatewayIntentBits, Partials } = require('discord.js');
const CommandHandler = require('./handlers/commandHandler');
const EventHandler = require('./handlers/eventHandler');
const config = require('./config/botConfig');
const logger = require('./utils/logger');

/**
 * Main bot client setup and initialization
 * @module bot
 */

class VibeBot {
    constructor() {
        this.client = null;
        this.commandHandler = null;
        this.eventHandler = null;
    }

    /**
     * Initialize the bot client with intents and partials
     */
    initializeClient() {
        try {
            // Validate configuration before starting
            config.validateConfig();

            // Convert string intents to Discord.js constants
            const intents = config.intents.map(intent => GatewayIntentBits[intent]);
            const partials = config.partials.map(partial => Partials[partial]);

            this.client = new Client({
                intents,
                partials
            });

            logger.info('Discord client initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Discord client', error);
            throw error;
        }
    }

    /**
     * Setup handlers for commands and events
     */
    async setupHandlers() {
        try {
            // Initialize command handler
            this.commandHandler = new CommandHandler(this.client);
            await this.commandHandler.loadCommands();

            // Initialize event handler
            this.eventHandler = new EventHandler(this.client);
            await this.eventHandler.loadEvents();

            logger.info('Handlers setup completed');
        } catch (error) {
            logger.error('Failed to setup handlers', error);
            throw error;
        }
    }

    /**
     * Setup process event listeners for graceful shutdown
     */
    setupProcessHandlers() {
        // Graceful shutdown on SIGINT (Ctrl+C)
        process.on('SIGINT', () => {
            logger.info('Received SIGINT. Initiating graceful shutdown...');
            this.shutdown();
        });

        // Graceful shutdown on SIGTERM
        process.on('SIGTERM', () => {
            logger.info('Received SIGTERM. Initiating graceful shutdown...');
            this.shutdown();
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception', error);
            this.shutdown(1);
        });

        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            this.shutdown(1);
        });

        logger.debug('Process handlers setup completed');
    }

    /**
     * Start the bot
     */
    async start() {
        try {
            logger.info('Starting VibeBot...');

            this.initializeClient();
            this.setupProcessHandlers();
            await this.setupHandlers();

            // Login to Discord
            await this.client.login(config.token);
            
        } catch (error) {
            logger.error('Failed to start bot', error);
            process.exit(1);
        }
    }

    /**
     * Gracefully shutdown the bot
     * @param {number} exitCode - Exit code for process termination
     */
    async shutdown(exitCode = 0) {
        try {
            logger.info('Shutting down bot...');

            if (this.client) {
                await this.client.destroy();
                logger.info('Discord client destroyed');
            }

            logger.info('Bot shutdown completed');
            process.exit(exitCode);
        } catch (error) {
            logger.error('Error during shutdown', error);
            process.exit(1);
        }
    }

    /**
     * Get the Discord client instance
     * @returns {Client} The Discord client
     */
    getClient() {
        return this.client;
    }

    /**
     * Get the command handler instance
     * @returns {CommandHandler} The command handler
     */
    getCommandHandler() {
        return this.commandHandler;
    }

    /**
     * Get the event handler instance
     * @returns {EventHandler} The event handler
     */
    getEventHandler() {
        return this.eventHandler;
    }
}

// Create and export bot instance
const bot = new VibeBot();

module.exports = bot;