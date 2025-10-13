require('dotenv').config();

/**
 * Bot configuration settings
 * @module botConfig
 */

const botConfig = {
    // Bot credentials
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,

    // Bot status configuration
    status: {
        type: process.env.BOT_STATUS || 'online',
        activity: {
            type: process.env.ACTIVITY_TYPE || 'PLAYING',
            name: process.env.ACTIVITY_NAME || 'Discord'
        }
    },

    // Bot intents and partials
    intents: [
        'Guilds',
        'GuildMessages', 
        'MessageContent',
        'GuildMembers'
    ],

    partials: [
        'Channel',
        'Message',
        'User',
        'GuildMember'
    ]
};

/**
 * Validates required environment variables
 * @throws {Error} If required environment variables are missing
 */
function validateConfig() {
    const required = ['TOKEN', 'CLIENT_ID'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}

module.exports = {
    ...botConfig,
    validateConfig
};