const { Events, ActivityType, PresenceUpdateStatus } = require('discord.js');
const logger = require('../utils/logger');
const config = require('../config/botConfig');

/**
 * Ready event - Fired when the bot successfully logs in
 */
module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        logger.info(`Bot ready! Logged in as ${client.user.tag}`);

        try {
            // Set bot presence
            await setBotPresence(client);
            
            // Log bot statistics
            logBotStats(client);
            
            logger.info('Bot initialization completed successfully');
        } catch (error) {
            logger.error('Error during bot initialization', error);
        }
    },
};

/**
 * Set the bot's presence (status and activity)
 * @param {Client} client - The Discord client
 */
async function setBotPresence(client) {
    try {
        const activityTypeMap = {
            'PLAYING': ActivityType.Playing,
            'WATCHING': ActivityType.Watching,
            'LISTENING': ActivityType.Listening,
            'STREAMING': ActivityType.Streaming,
            'COMPETING': ActivityType.Competing
        };

        const statusMap = {
            'online': PresenceUpdateStatus.Online,
            'idle': PresenceUpdateStatus.Idle,
            'dnd': PresenceUpdateStatus.DoNotDisturb,
            'invisible': PresenceUpdateStatus.Invisible
        };

        const statusType = statusMap[config.status.type] || PresenceUpdateStatus.Online;
        const activityType = activityTypeMap[config.status.activity.type] || ActivityType.Playing;

        await client.user.setPresence({
            status: statusType,
            activities: [{
                name: config.status.activity.name,
                type: activityType
            }]
        });

        logger.info(`Bot status set to: ${config.status.type}`);
        logger.info(`Activity set to: ${config.status.activity.type} ${config.status.activity.name}`);
    } catch (error) {
        logger.error('Failed to set bot presence', error);
    }
}

/**
 * Log bot statistics
 * @param {Client} client - The Discord client
 */
function logBotStats(client) {
    const guildCount = client.guilds.cache.size;
    const userCount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const commandCount = client.commands ? client.commands.size : 0;

    logger.info(`Bot Statistics:`);
    logger.info(`  - Guilds: ${guildCount}`);
    logger.info(`  - Users: ${userCount}`);
    logger.info(`  - Commands: ${commandCount}`);
}