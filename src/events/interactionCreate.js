const { Events } = require('discord.js');
const logger = require('../utils/logger');
const customCommandService = require('../services/customCommandService');
const { REST, Routes } = require('discord.js');
const config = require('../config/botConfig');
const { formatMessage } = require('../utils/formatMessage');

/**
 * Interaction event handler - Handles slash command interactions
 */
module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Handle button interactions for confirmation flows and translate picker
        if (interaction.isButton && interaction.customId) {
            try {
                const id = interaction.customId;
                // Expected formats: removecmd:{userId}:{name}, removecancel:{userId}:{name}, removeall:{userId}, removeallcancel:{userId}
                // Also handles: translate:pick:{userId}:{messageId}:{lang}, translate:cancel:{userId}
                if (id.startsWith('translate:pick:')) {
                    const parts = id.split(':');
                    // ['translate', 'pick', userId, messageId]
                    const userId = parts[2];
                    const messageId = parts[3];
                    const lang = parts[4] || 'EN';

                    if (interaction.user.id !== userId) {
                        await interaction.reply({ content: 'You are not authorized to select this item.', ephemeral: true });
                        return;
                    }

                    const deeplKey = process.env.DEEPL;
                    if (!deeplKey) {
                        await interaction.reply({ content: 'DeepL API key is not configured on the bot.', ephemeral: true });
                        return;
                    }

                    const channel = interaction.channel;
                    if (!channel || !channel.isTextBased()) {
                        await interaction.reply({ content: 'This action must occur in a text channel.', ephemeral: true });
                        return;
                    }

                    // Acknowledge and remove buttons
                    await interaction.update({ content: 'Translating selected message…', components: [] });

                    let targetMessage = null;
                    try {
                        targetMessage = await channel.messages.fetch(messageId);
                    } catch (e) {}

                    if (!targetMessage || !targetMessage.content || !targetMessage.content.trim()) {
                        await interaction.followUp({ content: 'Could not find that message or it has no text to translate.', ephemeral: true });
                        return;
                    }

                    // Perform DeepL translation to selected language
                    const isFree = /:fx$/.test(deeplKey);
                    const endpoint = `https://${isFree ? 'api-free' : 'api'}.deepl.com/v2/translate`;

                    const body = new URLSearchParams();
                    body.append('auth_key', deeplKey);
                    body.append('text', targetMessage.content);
                    body.append('target_lang', lang);
                    body.append('preserve_formatting', '1');

                    try {
                        const res = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                            body: body.toString(),
                        });
                        const data = await res.json().catch(() => null);
                        if (!res.ok || !data || !data.translations || !data.translations[0]) {
                            const reason = data && data.message ? `: ${data.message}` : '';
                            await interaction.followUp({ content: `DeepL translation failed${reason}`, ephemeral: true });
                            return;
                        }

                        const translated = (data.translations[0].text || '').toString();
                        const output = translated.length > 2000 ? translated.slice(0, 1999) + '…' : translated;

                        // Send the translation to the channel (public) only, no additional confirmation message
                        await channel.send({ content: output, allowedMentions: { parse: [] } });
                    } catch (err) {
                        await interaction.followUp({ content: 'Error occurred while contacting DeepL.', ephemeral: true });
                    }

                    return;
                }

                if (id.startsWith('translate:cancel:')) {
                    const [, , userId] = id.split(':');
                    if (interaction.user.id !== userId) {
                        await interaction.reply({ content: 'You are not authorized to perform this action.', ephemeral: true });
                        return;
                    }
                    await interaction.update({ content: 'Translation cancelled.', components: [] });
                    return;
                }

                if (id.startsWith('removecmd:') || id.startsWith('removecancel:')) {
                    const [, userId, name] = id.split(':');
                    if (interaction.user.id !== userId) {
                        await interaction.reply({ content: 'You are not authorized to confirm this action.', ephemeral: true });
                        return;
                    }

                    if (id.startsWith('removecancel:')) {
                        await interaction.update({ content: `Removal cancelled for '/${name}'.`, components: [] });
                        return;
                    }

                    // Proceed to remove command and deregister slash command
                    const guildId = interaction.guildId;
                    customCommandService.removeCommand(guildId, name);

                    try {
                        const rest = new REST({ version: '10' }).setToken(config.token);
                        const guildCommands = await rest.get(Routes.applicationGuildCommands(config.clientId, guildId));
                        if (Array.isArray(guildCommands)) {
                            const cmd = guildCommands.find(c => c.name === name);
                            if (cmd) await rest.delete(Routes.applicationGuildCommand(config.clientId, guildId, cmd.id));
                        }
                    } catch (err) {
                        logger.error('Failed to deregister guild command', err);
                    }

                    await interaction.update({ content: `Custom command '/${name}' removed.`, components: [] });
                    return;
                }

                if (id.startsWith('removeall:') || id.startsWith('removeallcancel:')) {
                    const [, userId] = id.split(':');
                    if (interaction.user.id !== userId) {
                        await interaction.reply({ content: 'You are not authorized to confirm this action.', ephemeral: true });
                        return;
                    }

                    if (id.startsWith('removeallcancel:')) {
                        await interaction.update({ content: 'Removal cancelled for all custom commands.', components: [] });
                        return;
                    }

                    const guildId = interaction.guildId;
                    // Remove all stored commands
                    const commands = customCommandService.getCommandsForGuild(guildId);
                    const names = Object.keys(commands || {});
                    names.forEach(n => customCommandService.removeCommand(guildId, n));

                    // Attempt to deregister guild slash commands that match
                    try {
                        const rest = new REST({ version: '10' }).setToken(config.token);
                        const guildCommands = await rest.get(Routes.applicationGuildCommands(config.clientId, guildId));
                        if (Array.isArray(guildCommands)) {
                            for (const cmd of guildCommands) {
                                if (names.includes(cmd.name)) {
                                    await rest.delete(Routes.applicationGuildCommand(config.clientId, guildId, cmd.id));
                                }
                            }
                        }
                    } catch (err) {
                        logger.error('Failed to deregister guild commands', err);
                    }

                    await interaction.update({ content: `All custom commands removed for this server.`, components: [] });
                    return;
                }
            } catch (err) {
                logger.error('Error handling button interaction', err);
                try { await interaction.reply({ content: 'An error occurred while processing the action.', ephemeral: true }); } catch (e) {}
            }
        }

        // Handle language selection for translate flow
        if (interaction.isStringSelectMenu && interaction.customId && interaction.customId.startsWith('translate:lang:')) {
            try {
                const [, , userId] = interaction.customId.split(':');
                if (interaction.user.id !== userId) {
                    await interaction.reply({ content: 'You are not authorized to change this setting.', ephemeral: true });
                    return;
                }

                const selected = interaction.values && interaction.values[0] ? interaction.values[0] : 'EN';

                // Rebuild components so the UI reflects the selected language and buttons encode it
                const message = interaction.message;
                const components = message.components || [];

                // Import builders lazily to avoid top-level require in this file
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

                // Row 0: message index buttons
                let msgRow = null;
                if (components[0] && components[0].components) {
                    const btns = components[0].components;
                    msgRow = new ActionRowBuilder().addComponents(
                        ...btns.map((btn) => {
                            const origId = btn.customId || btn.data?.custom_id || '';
                            const newId = origId.replace(/^(translate:pick:[^:]+:[^:]+)(?::[A-Z-]+)?$/, `$1:${selected}`);
                            const label = btn.label || btn.data?.label || '•';
                            const style = btn.style || btn.data?.style || ButtonStyle.Primary;
                            return new ButtonBuilder().setCustomId(newId).setLabel(label).setStyle(style);
                        })
                    );
                }

                // Row 1: language select menu with the selected option marked as default
                let langRow = null;
                const languages = [
                    { label: 'English (EN)', value: 'EN', description: 'Translate to English' },
                    { label: 'English US (EN-US)', value: 'EN-US', description: 'Translate to English (US)' },
                    { label: 'English GB (EN-GB)', value: 'EN-GB', description: 'Translate to English (UK)' },
                    { label: 'Spanish (ES)', value: 'ES' },
                    { label: 'French (FR)', value: 'FR' },
                    { label: 'German (DE)', value: 'DE' },
                    { label: 'Italian (IT)', value: 'IT' },
                    { label: 'Portuguese (PT)', value: 'PT' },
                    { label: 'Portuguese BR (PT-BR)', value: 'PT-BR' },
                    { label: 'Dutch (NL)', value: 'NL' },
                    { label: 'Polish (PL)', value: 'PL' },
                    { label: 'Russian (RU)', value: 'RU' },
                    { label: 'Japanese (JA)', value: 'JA' },
                    { label: 'Chinese (ZH)', value: 'ZH' },
                ];

                const select = new StringSelectMenuBuilder()
                    .setCustomId(`translate:lang:${userId}`)
                    .setPlaceholder('Select target language')
                    .addOptions(
                        ...languages.map(opt => ({ ...opt, default: opt.value === selected }))
                    );
                langRow = new ActionRowBuilder().addComponents(select);

                // Row 2: cancel (reuse existing row if present)
                const cancelRow = components[2] || null;

                const newComponents = [msgRow || components[0], langRow || components[1]];
                if (cancelRow) newComponents.push(cancelRow);

                await interaction.update({ components: newComponents });
            } catch (err) {
                try { await interaction.reply({ content: 'Failed to update language.', ephemeral: true }); } catch {}
            }
            return;
        }

        // Only handle chat input commands (slash commands)
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            // Try to serve dynamic custom commands created per-guild
            try {
                const guildId = interaction.guildId;
                if (guildId) {
                    const stored = await customCommandService.getCommand(guildId, interaction.commandName);
                    if (stored) {
                        const output = formatMessage(stored, { userTag: interaction.user.tag, userId: interaction.user.id, guildName: interaction.guild ? interaction.guild.name : '' });

                        await interaction.reply({ content: output });
                        return;
                    }
                }
            } catch (err) {
                logger.error('Error handling dynamic command', err);
            }

            logger.warn(`Unknown command executed: ${interaction.commandName}`);
            return;
        }

        try {
            // Log command usage for analytics
            logCommandUsage(interaction);

            // Execute the command
            await command.execute(interaction);

            logger.debug(`Command ${interaction.commandName} executed successfully by ${interaction.user.tag}`);
        } catch (error) {
            logger.error(`Error executing command ${interaction.commandName}`, error);
            
            // Send error response to user
            await handleCommandError(interaction, error);
        }
    },
};

/**
 * Log command usage for analytics
 * @param {CommandInteraction} interaction - The command interaction
 */
function logCommandUsage(interaction) {
    const { commandName, user, guild } = interaction;
    const guildInfo = guild ? `${guild.name} (${guild.id})` : 'DM';
    
    logger.info(`Command executed: ${commandName} by ${user.tag} (${user.id}) in ${guildInfo}`);
}

/**
 * Handle command execution errors
 * @param {CommandInteraction} interaction - The command interaction
 * @param {Error} error - The error that occurred
 */
async function handleCommandError(interaction, error) {
    const errorMessage = 'There was an error while executing this command!';
    const errorDetails = process.env.NODE_ENV === 'development' ? `\n\`\`\`${error.message}\`\`\`` : '';

    try {
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ 
                content: errorMessage + errorDetails, 
                ephemeral: true 
            });
        } else {
            await interaction.reply({ 
                content: errorMessage + errorDetails, 
                ephemeral: true 
            });
        }
    } catch (followUpError) {
        logger.error('Failed to send error message to user', followUpError);
    }
}