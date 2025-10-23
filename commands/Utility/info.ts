import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import config from '../../src/config/botConfig';
import pkg from '../../package.json';

function formatUptime(ms: number): string {
    if (!ms || ms <= 0) return '0s';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts: string[] = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (seconds) parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
}

export default {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription("Display information about the bot (version, creator, uptime, etc.)."),

    async execute(interaction: ChatInputCommandInteraction) {
        const client = interaction.client;

        // package info
        const version = pkg.version || 'unknown';
        const author = pkg.author || (config as any).author || 'unknown';
        const homepage = pkg.homepage || null;
        let repoUrl: string | null = null;
        if (pkg.repository) {
            repoUrl = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository.url;
            if (repoUrl && repoUrl.startsWith('git+')) repoUrl = repoUrl.replace(/^git\+/, '');
            if (repoUrl && repoUrl.endsWith('.git')) repoUrl = repoUrl.replace(/\.git$/, '');
        }

        // runtime info
        const nodeVersion = process.version;
        const djs = await import('discord.js');
        const djsVersion = djs.version || (pkg.dependencies && (pkg.dependencies as any)['discord.js']) || 'unknown';
        const uptime = client.uptime ?? 0;
        const guildCount = typeof client.guilds?.cache?.size === 'number' ? client.guilds.cache.size : 'N/A';

        const embed = new EmbedBuilder()
            .setTitle('VibeBot — Info')
            .setColor(0x5865F2)
            .setThumbnail(client.user?.displayAvatarURL?.() || null)
            .addFields(
                { name: 'Version', value: `${version}`, inline: true },
                { name: 'Creator', value: `${author}`, inline: true },
                { name: 'Library', value: `discord.js v${djsVersion}`, inline: true },
                { name: 'Node', value: `${nodeVersion}`, inline: true },
                { name: 'Uptime', value: `${formatUptime(uptime)}`, inline: true },
                { name: 'Servers', value: `${guildCount}`, inline: true }
            );

        const links: string[] = [];
        if (homepage) links.push(`[Homepage](${homepage})`);
        if (repoUrl) links.push(`[Source](${repoUrl})`);
        if ((config as any).clientId) {
            const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent((config as any).clientId)}&permissions=0&scope=${encodeURIComponent('bot applications.commands')}`;
            links.push(`[Invite](${inviteUrl})`);
        }

        if (links.length) embed.addFields({ name: 'Links', value: links.join(' • ') });

        try {
            await interaction.reply({ embeds: [embed], ephemeral: false });
        } catch (error) {
            console.error('Error sending /info reply:', error);
            await interaction.reply({ content: `Bot version: ${version}\nCreator: ${author}`, ephemeral: true });
        }
    }
};
