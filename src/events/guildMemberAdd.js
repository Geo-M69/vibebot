const { Events, ChannelType } = require('discord.js');
const welcomeService = require('../services/welcomeService');
const logger = require('../utils/logger');
const { formatMessage } = require('../utils/formatMessage');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            const guild = member.guild;
            const raw = await welcomeService.getWelcomeMessage(guild.id);
            if (!raw) return; // no welcome message set

            const message = formatMessage(raw, { userTag: member.user.tag, userId: member.id, guildName: guild.name });

            // Prefer system channel, fallback to first writable text channel
            let channel = guild.systemChannel;
            if (!channel || channel.type !== ChannelType.GuildText) {
                channel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.permissionsFor(guild.members.me).has('SendMessages'));
            }

            if (!channel) {
                logger.warn(`No channel available to send welcome message in guild ${guild.id}`);
                return;
            }

            await channel.send({ content: message });
        } catch (error) {
            logger.error('Failed to send welcome message', error);
        }
    }
};
