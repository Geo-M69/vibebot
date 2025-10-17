const { Events } = require('discord.js');
const customCommandService = require('../services/customCommandService');
const logger = require('../utils/logger');
const { formatMessage } = require('../utils/formatMessage');

// Default prefix - changeable if you implement a prefix service
const DEFAULT_PREFIX = '!';

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        try {
            if (message.author.bot) return;

            const guildId = message.guildId;
            const content = message.content.trim();

            if (!content.startsWith(DEFAULT_PREFIX)) return;

            const args = content.slice(DEFAULT_PREFIX.length).split(/\s+/);
            const command = args.shift().toLowerCase();

            // Admin commands to manage custom commands
            if (command === 'addcommand' || command === 'createcommand' || command === 'addcmd') {
                if (!message.member.permissions.has('Administrator')) {
                    await message.reply('You need Administrator permission to create custom commands.');
                    return;
                }

                const name = args.shift();
                const response = args.join(' ');

                if (!name || !response) {
                    await message.reply('Usage: !addcommand [name] [response]');
                    return;
                }

                await customCommandService.setCommand(guildId, name.toLowerCase(), response);
                await message.reply(`Custom command '!${name}' created.`);
                return;
            }

            if (command === 'removecommand' || command === 'delcommand' || command === 'removecmd') {
                if (!message.member.permissions.has('Administrator')) {
                    await message.reply('You need Administrator permission to remove custom commands.');
                    return;
                }

                const name = args.shift();
                if (!name) {
                    await message.reply('Usage: !removecommand [name]');
                    return;
                }

                await customCommandService.removeCommand(guildId, name.toLowerCase());
                await message.reply(`Custom command '!${name}' removed.`);
                return;
            }

            // Execute stored custom commands
            const stored = await customCommandService.getCommand(guildId, command);
            if (stored) {
                const output = formatMessage(stored, { userTag: message.author.tag, userId: message.author.id, guildName: message.guild ? message.guild.name : '' });
                await message.channel.send(output);
            }
        } catch (error) {
            logger.error('Error processing messageCreate', error);
        }
    }
};
