const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

/**
 * Event handler for loading and managing Discord bot events
 * @module eventHandler
 */

class EventHandler {
    constructor(client) {
        this.client = client;
    }

    /**
     * Load all events from the events directory
     * @param {string} eventsPath - Path to the events directory
     */
    async loadEvents(eventsPath = path.join(__dirname, '../events')) {
        try {
            try {
                await fs.access(eventsPath);
            } catch (err) {
                logger.warn(`Events directory not found: ${eventsPath}`);
                return;
            }

            const entries = await fs.readdir(eventsPath);
            const eventFiles = entries.filter(file => file.endsWith('.js'));

            if (eventFiles.length === 0) {
                logger.warn('No event files found');
                return;
            }

            let loadedCount = 0;

            for (const file of eventFiles) {
                const filePath = path.join(eventsPath, file);
                
                try {
                    // Clear require cache for hot reloading in development
                    if (process.env.NODE_ENV === 'development') {
                        delete require.cache[require.resolve(filePath)];
                    }

                    const event = require(filePath);

                    if (this.validateEvent(event, file)) {
                        if (event.once) {
                            this.client.once(event.name, (...args) => event.execute(...args));
                        } else {
                            this.client.on(event.name, (...args) => event.execute(...args));
                        }
                        
                        loadedCount++;
                        logger.debug(`Loaded event: ${event.name}`);
                    }
                } catch (error) {
                    logger.error(`Failed to load event ${file}`, error);
                }
            }

            logger.info(`Successfully loaded ${loadedCount} event(s)`);
        } catch (error) {
            logger.error('Error loading events', error);
        }
    }

    /**
     * Validate an event object
     * @param {Object} event - The event object to validate
     * @param {string} filename - The filename for logging purposes
     * @returns {boolean} - Whether the event is valid
     */
    validateEvent(event, filename) {
        if (!event.name || !event.execute) {
            logger.warn(`Event at ${filename} is missing required 'name' or 'execute' property`);
            return false;
        }

        if (typeof event.execute !== 'function') {
            logger.warn(`Event at ${filename} execute property is not a function`);
            return false;
        }

        return true;
    }
}

module.exports = EventHandler;