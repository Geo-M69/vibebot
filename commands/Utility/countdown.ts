import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, Message } from 'discord.js';

// In-memory tracking of active timers and simple rate limiting (process-lifetime)
const activeTimers = new Map<string, TimerState>(); // key: messageId -> TimerState
const userActiveCount = new Map<string, number>(); // userId -> count
const channelActiveCount = new Map<string, number>(); // channelId -> count

const USER_LIMIT = 3; // max concurrent timers per user
const CHANNEL_LIMIT = 6; // max concurrent timers per channel

interface TimerState {
    interval: NodeJS.Timeout | null;
    end: number;
    remaining: number;
    paused: boolean;
    userId: string;
    channelId: string;
    originalSeconds: number;
    messageId: string;
    interactionId: string;
}

function parseDuration(input: string | null): number | null {
    if (!input || typeof input !== 'string') return null;
    input = input.trim();

    // Support HH:MM:SS or MM:SS or SS
    if (/^\d{1,2}:\d{1,2}:\d{1,2}$/.test(input) || /^\d{1,2}:\d{1,2}$/.test(input)) {
        const parts = input.split(':').map(p => parseInt(p, 10));
        if (parts.some(isNaN)) return null;
        let seconds = 0;
        if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
        return seconds;
    }

    // Support textual like 1d2h30m10s
    const regex = /(\d+)\s*(d|h|m|s)/gi;
    let match;
    let seconds = 0;
    let found = false;
    while ((match = regex.exec(input)) !== null) {
        found = true;
        const val = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        if (unit === 'd') seconds += val * 86400;
        else if (unit === 'h') seconds += val * 3600;
        else if (unit === 'm') seconds += val * 60;
        else if (unit === 's') seconds += val;
    }
    if (found) return seconds;

    // Fallback: a plain number in seconds
    if (/^\d+$/.test(input)) return parseInt(input, 10);

    return null;
}

function formatDuration(sec: number): string {
    if (!sec || sec <= 0) return '0s';
    const d = Math.floor(sec / 86400);
    sec %= 86400;
    const h = Math.floor(sec / 3600);
    sec %= 3600;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const parts: string[] = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (s) parts.push(`${s}s`);
    return parts.join(' ');
}

function getUpdateInterval(totalSeconds: number): number {
    if (totalSeconds <= 60) return 5; // every 5s
    if (totalSeconds <= 600) return 15; // every 15s
    if (totalSeconds <= 3600) return 60; // every 60s
    return 300; // every 5 minutes for longer timers
}

export default {
    data: new SlashCommandBuilder()
        .setName('countdown')
        .setDescription('Start a countdown timer.')
        .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g. 1h30m, 90m, 01:30:00, 300).').setRequired(true))
        .addStringOption(opt => opt.setName('message').setDescription('Optional message to send when the timer finishes.'))
        .addBooleanOption(opt => opt.setName('mention').setDescription('Mention the user when the timer finishes?').setRequired(false)),

    async execute(interaction: ChatInputCommandInteraction) {
        const durationRaw = interaction.options.getString('duration');
        const customMsg = interaction.options.getString('message') || '';
        const mention = interaction.options.getBoolean('mention') || false;

        const seconds = parseDuration(durationRaw);
        if (seconds === null || isNaN(seconds) || seconds <= 0) {
            return interaction.reply({ content: 'Invalid duration format. Examples: `1h30m`, `90m`, `01:30:00`, or `300` (seconds).', ephemeral: true });
        }

        const MAX_SECONDS = 7 * 24 * 3600; // 7 days limit
        if (seconds > MAX_SECONDS) {
            return interaction.reply({ content: 'Duration too long. Maximum allowed is 7 days.', ephemeral: true });
        }

        const end = Date.now() + seconds * 1000;
        const updateInterval = getUpdateInterval(seconds) * 1000;

        const embed = new EmbedBuilder()
            .setTitle('Countdown started')
            .setColor(0x5865F2)
            .addFields(
                { name: 'Duration', value: formatDuration(seconds), inline: true },
                { name: 'Ends At', value: `<t:${Math.floor(end / 1000)}:f>`, inline: true }
            )
            .setFooter({ text: `Started by ${interaction.user.tag}` });

        // Enforce simple rate limits before starting
        const currentUserCount = userActiveCount.get(interaction.user.id) || 0;
        if (currentUserCount >= USER_LIMIT) {
            return interaction.reply({ content: `You already have ${USER_LIMIT} active timers. Please wait for one to finish or cancel it.`, ephemeral: true });
        }
        const currentChannelCount = channelActiveCount.get(interaction.channelId) || 0;
        if (currentChannelCount >= CHANNEL_LIMIT) {
            return interaction.reply({ content: `This channel already has ${CHANNEL_LIMIT} active timers. Please wait for one to finish or ask an admin to remove timers.`, ephemeral: true });
        }

        // increment counters
        userActiveCount.set(interaction.user.id, currentUserCount + 1);
        channelActiveCount.set(interaction.channelId, currentChannelCount + 1);

        // Buttons for controls
        const pauseBtn = new ButtonBuilder().setCustomId(`cd_pause_${interaction.id}`).setLabel('Pause').setStyle(ButtonStyle.Primary);
        const resumeBtn = new ButtonBuilder().setCustomId(`cd_resume_${interaction.id}`).setLabel('Resume').setStyle(ButtonStyle.Success).setDisabled(true);
        const cancelBtn = new ButtonBuilder().setCustomId(`cd_cancel_${interaction.id}`).setLabel('Cancel').setStyle(ButtonStyle.Danger);
        const controlRow = new ActionRowBuilder<ButtonBuilder>().addComponents(pauseBtn, resumeBtn, cancelBtn);

        let message: Message;
        try {
            message = await interaction.reply({ embeds: [embed], components: [controlRow], fetchReply: true });
        } catch (err) {
            console.error('Failed to send countdown reply:', err);
            // revert counters
            userActiveCount.set(interaction.user.id, Math.max(0, (userActiveCount.get(interaction.user.id) || 1) - 1));
            channelActiveCount.set(interaction.channelId, Math.max(0, (channelActiveCount.get(interaction.channelId) || 1) - 1));
            return interaction.reply({ content: 'Failed to start countdown.', ephemeral: true });
        }

        // timer state object
        const state: TimerState = {
            interval: null,
            end,
            remaining: seconds,
            paused: false,
            userId: interaction.user.id,
            channelId: interaction.channelId,
            originalSeconds: seconds,
            messageId: message.id,
            interactionId: interaction.id
        };

        const tick = async () => {
            const remaining = Math.max(0, Math.round((state.end - Date.now()) / 1000));
            state.remaining = remaining;
            try {
                if (remaining <= 0) {
                    if (state.interval) clearInterval(state.interval);
                    activeTimers.delete(state.messageId);
                    // decrement counters
                    userActiveCount.set(state.userId, Math.max(0, (userActiveCount.get(state.userId) || 1) - 1));
                    channelActiveCount.set(state.channelId, Math.max(0, (channelActiveCount.get(state.channelId) || 1) - 1));

                    const finishedEmbed = new EmbedBuilder()
                        .setTitle('Countdown finished')
                        .setColor(0x57F287)
                        .setDescription(customMsg || `<@${state.userId}> your timer has finished!`)
                        .addFields(
                            { name: 'Original Duration', value: formatDuration(state.originalSeconds), inline: true },
                            { name: 'Ended At', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true }
                        );

                    // Edit original message to show finished state and remove components
                    await message.edit({ embeds: [finishedEmbed], components: [] }).catch(() => null);

                    // Optionally send a mention or message in channel
                    const mentionText = mention ? `<@${state.userId}> ` : '';
                    await interaction.followUp({ content: `${mentionText}${customMsg || 'Countdown finished!'}` });
                    return;
                }

                // Update embed with remaining time (adaptive frequency)
                const remEmbed = new EmbedBuilder()
                    .setTitle(state.paused ? 'Countdown paused' : 'Countdown running')
                    .setColor(0x5865F2)
                    .addFields(
                        { name: 'Remaining', value: formatDuration(remaining), inline: true },
                        { name: 'Ends At', value: `<t:${Math.floor(state.end / 1000)}:f>`, inline: true }
                    )
                    .setFooter({ text: `Started by ${interaction.user.tag}` });

                await message.edit({ embeds: [remEmbed] }).catch(() => null);
            } catch (err) {
                console.error('Error updating countdown message:', err);
            }
        };

        // start interval
        state.interval = setInterval(tick, updateInterval);
        activeTimers.set(message.id, state);

        // set up component collector for controls
        const filter = (i: any) => i.user.id === interaction.user.id && i.message.id === message.id;
        const collector = message.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: Math.max(60000, seconds * 1000) + 120000 });

        collector.on('collect', async i => {
            try {
                if (i.customId === `cd_pause_${interaction.id}`) {
                    if (state.paused) return i.reply({ content: 'Already paused.', ephemeral: true });
                    // pause: clear interval and record remaining
                    if (state.interval) clearInterval(state.interval);
                    state.paused = true;
                    state.remaining = Math.max(0, Math.round((state.end - Date.now()) / 1000));
                    // enable resume, disable pause
                    const newPause = ButtonBuilder.from(pauseBtn).setDisabled(true);
                    const newResume = ButtonBuilder.from(resumeBtn).setDisabled(false);
                    const newCancel = ButtonBuilder.from(cancelBtn).setDisabled(false);
                    await i.update({ components: [new ActionRowBuilder<ButtonBuilder>().addComponents(newPause, newResume, newCancel)] });
                    // one immediate update
                    await tick();
                    return;
                }

                if (i.customId === `cd_resume_${interaction.id}`) {
                    if (!state.paused) return i.reply({ content: 'Timer is not paused.', ephemeral: true });
                    // resume: set new end and restart interval
                    state.paused = false;
                    state.end = Date.now() + state.remaining * 1000;
                    state.interval = setInterval(tick, updateInterval);
                    const newPause = ButtonBuilder.from(pauseBtn).setDisabled(false);
                    const newResume = ButtonBuilder.from(resumeBtn).setDisabled(true);
                    const newCancel = ButtonBuilder.from(cancelBtn).setDisabled(false);
                    await i.update({ components: [new ActionRowBuilder<ButtonBuilder>().addComponents(newPause, newResume, newCancel)] });
                    return;
                }

                if (i.customId === `cd_cancel_${interaction.id}`) {
                    // cancel the timer
                    if (state.interval) clearInterval(state.interval);
                    activeTimers.delete(state.messageId);
                    // decrement counters
                    userActiveCount.set(state.userId, Math.max(0, (userActiveCount.get(state.userId) || 1) - 1));
                    channelActiveCount.set(state.channelId, Math.max(0, (channelActiveCount.get(state.channelId) || 1) - 1));

                    const canceledEmbed = new EmbedBuilder()
                        .setTitle('Countdown canceled')
                        .setColor(0xed4245)
                        .setDescription(`Countdown canceled by <@${interaction.user.id}>`)
                        .addFields({ name: 'Remaining', value: formatDuration(state.remaining), inline: true });

                    await i.update({ embeds: [canceledEmbed], components: [] }).catch(() => null);
                    collector.stop();
                    return;
                }
            } catch (err) {
                console.error('Error handling countdown control:', err);
            }
        });

        collector.on('end', async () => {
            // If the timer still exists and wasn't finished/canceled, leave it running but remove components
            try {
                const stored = activeTimers.get(message.id);
                if (stored) {
                    await message.edit({ components: [] }).catch(() => null);
                }
            } catch (err) { /* ignore */ }
        });
    }
};
