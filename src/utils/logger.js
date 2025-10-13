/**
 * Enhanced logging utility with timestamps and log levels
 * @module logger
 */

const logger = {
    /**
     * Log informational messages
     * @param {string} message - The message to log
     */
    info: (message) => {
        console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
    },

    /**
     * Log error messages
     * @param {string} message - The error message to log
     * @param {Error} [error] - Optional error object for stack trace
     */
    error: (message, error = null) => {
        console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
        if (error && error.stack) {
            console.error(error.stack);
        }
    },

    /**
     * Log warning messages
     * @param {string} message - The warning message to log
     */
    warn: (message) => {
        console.warn(`[WARN] ${new Date().toISOString()}: ${message}`);
    },

    /**
     * Log debug messages (only in development)
     * @param {string} message - The debug message to log
     */
    debug: (message) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`);
        }
    }
};

module.exports = logger;