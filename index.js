/**
 * VibeBot - Discord Bot Entry Point
 * 
 * This is the main entry point for the VibeBot Discord application.
 * The actual bot logic is contained in the src/ directory for better organization.
 * 
 * @author Geo-M69
 * @version 2.0.0
 */

// Import and start the bot
const bot = require('./src/bot');

// Start the bot
bot.start().catch(error => {
    console.error('Failed to start bot:', error);
    process.exit(1);
});