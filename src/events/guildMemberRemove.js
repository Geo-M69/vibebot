const { Events, ChannelType } = require('discord.js');
const goodbyeService = require('../services/goodbyeService');
const logger = require('../utils/logger');
const { formatMessage } = require('../utils/formatMessage');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        try {
            const guild = member.guild;
            const raw = await goodbyeService.getGoodbyeMessage(guild.id);
            if (!raw) return; // no goodbye message set

            const message = formatMessage(raw, { userTag: member.user.tag, userId: member.id, guildName: guild.name });

            // Prefer system channel, fallback to first writable text channel
            let channel = guild.systemChannel;
            if (!channel || channel.type !== ChannelType.GuildText) {
                channel = guild.channels.cache.find(ch => ch.type === ChannelType.GuildText && ch.permissionsFor(guild.members.me).has('SendMessages'));
            }

            if (!channel) {
                logger.warn(`No channel available to send goodbye message in guild ${guild.id}`);
                return;
            }

            await channel.send({ content: message });
        } catch (error) {
            logger.error('Failed to send goodbye message', error);
        }
    }
};
