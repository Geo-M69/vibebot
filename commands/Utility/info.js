"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const botConfig_1 = __importDefault(require("../../src/config/botConfig"));
const package_json_1 = __importDefault(require("../../package.json"));
function formatUptime(ms) {
    if (!ms || ms <= 0)
        return '0s';
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const parts = [];
    if (days)
        parts.push(`${days}d`);
    if (hours)
        parts.push(`${hours}h`);
    if (minutes)
        parts.push(`${minutes}m`);
    if (seconds)
        parts.push(`${seconds}s`);
    return parts.join(' ') || '0s';
}
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('info')
        .setDescription("Display information about the bot (version, creator, uptime, etc.)."),
    async execute(interaction) {
        const client = interaction.client;
        // package info
        const version = package_json_1.default.version || 'unknown';
        const author = package_json_1.default.author || botConfig_1.default.author || 'unknown';
        const homepage = package_json_1.default.homepage || null;
        let repoUrl = null;
        if (package_json_1.default.repository) {
            repoUrl = typeof package_json_1.default.repository === 'string' ? package_json_1.default.repository : package_json_1.default.repository.url;
            if (repoUrl && repoUrl.startsWith('git+'))
                repoUrl = repoUrl.replace(/^git\+/, '');
            if (repoUrl && repoUrl.endsWith('.git'))
                repoUrl = repoUrl.replace(/\.git$/, '');
        }
        // runtime info
        const nodeVersion = process.version;
        const djs = await Promise.resolve().then(() => __importStar(require('discord.js')));
        const djsVersion = djs.version || (package_json_1.default.dependencies && package_json_1.default.dependencies['discord.js']) || 'unknown';
        const uptime = client.uptime ?? 0;
        const guildCount = typeof client.guilds?.cache?.size === 'number' ? client.guilds.cache.size : 'N/A';
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('VibeBot — Info')
            .setColor(0x5865F2)
            .setThumbnail(client.user?.displayAvatarURL?.() || null)
            .addFields({ name: 'Version', value: `${version}`, inline: true }, { name: 'Creator', value: `${author}`, inline: true }, { name: 'Library', value: `discord.js v${djsVersion}`, inline: true }, { name: 'Node', value: `${nodeVersion}`, inline: true }, { name: 'Uptime', value: `${formatUptime(uptime)}`, inline: true }, { name: 'Servers', value: `${guildCount}`, inline: true });
        const links = [];
        if (homepage)
            links.push(`[Homepage](${homepage})`);
        if (repoUrl)
            links.push(`[Source](${repoUrl})`);
        if (botConfig_1.default.clientId) {
            const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(botConfig_1.default.clientId)}&permissions=0&scope=${encodeURIComponent('bot applications.commands')}`;
            links.push(`[Invite](${inviteUrl})`);
        }
        if (links.length)
            embed.addFields({ name: 'Links', value: links.join(' • ') });
        try {
            await interaction.reply({ embeds: [embed], ephemeral: false });
        }
        catch (error) {
            console.error('Error sending /info reply:', error);
            await interaction.reply({ content: `Bot version: ${version}\nCreator: ${author}`, ephemeral: true });
        }
    }
};
