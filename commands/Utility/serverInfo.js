const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

function formatTimestamp(ms) {
    if (!ms) return 'Unknown';
    return `<t:${Math.floor(ms / 1000)}:f> (<t:${Math.floor(ms / 1000)}:R>)`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display information about this server (members, channels, boosts, etc.).'),

    async execute(interaction) {
        const guild = interaction.guild;

        if (!guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        // Attempt to get owner information
        let ownerTag = 'Unknown';
        try {
            const owner = await guild.fetchOwner();
            ownerTag = `${owner.user.tag}`;
        } catch (err) {
            // ignore — leave as Unknown
        }

        // Counts
        const memberCount = guild.memberCount ?? 'N/A';
        const roleCount = guild.roles?.cache?.size ?? 'N/A';
        const emojiCount = guild.emojis?.cache?.size ?? 0;
        const stickerCount = guild.stickers?.cache?.size ?? 0;
        const channels = guild.channels?.cache;
        const textChannels = channels ? channels.filter(c => c.isTextBased()).size : 'N/A';
        const voiceChannels = channels ? channels.filter(c => c.isVoiceBased()).size : 'N/A';

        const boosts = guild.premiumSubscriptionCount ?? 0;
        const tierMap = { 0: 'None', 1: 'Tier 1', 2: 'Tier 2', 3: 'Tier 3' };
        const boostTier = tierMap[guild.premiumTier] ?? 'Unknown';

        const verification = guild.verificationLevel ?? 'Unknown';
        const locale = guild.preferredLocale ?? 'Unknown';

        const embed = new EmbedBuilder()
            .setTitle(`${guild.name} — Server Info`)
            .setThumbnail(guild.iconURL?.() || null)
            .setColor(0x57F287)
            .addFields(
                { name: 'Server ID', value: `${guild.id}`, inline: true },
                { name: 'Owner', value: ownerTag, inline: true },
                { name: 'Created', value: formatTimestamp(guild.createdTimestamp), inline: true },
                { name: 'Members', value: `${memberCount}`, inline: true },
                { name: 'Roles', value: `${roleCount}`, inline: true },
                { name: 'Channels', value: `Text: ${textChannels}\nVoice: ${voiceChannels}`, inline: true },
                { name: 'Emojis', value: `${emojiCount} • Stickers: ${stickerCount}`, inline: true },
                { name: 'Boosts', value: `${boosts} (${boostTier})`, inline: true },
                { name: 'Verification', value: `${verification}`, inline: true },
                { name: 'Locale', value: `${locale}`, inline: true }
            );

        try {
            await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('Error sending /serverinfo reply:', error);
            await interaction.reply({ content: `Server: ${guild.name}\nMembers: ${memberCount}`, ephemeral: true });
        }
    }
};
