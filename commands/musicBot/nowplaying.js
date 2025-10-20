"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const musicPlayer = require('../../src/services/musicPlayer');
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Show the currently playing song'),
    async execute(interaction) {
        const member = interaction.member;
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ You need to be in a voice channel!')
                ],
                ephemeral: true
            });
        }
        const queue = musicPlayer.getQueue(interaction.guildId);
        if (!queue.currentSong) {
            return interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ Nothing is playing right now!')
                ],
                ephemeral: true
            });
        }
        const song = queue.currentSong;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎵 Now Playing')
            .setDescription(`[${song.title}](${song.url})`)
            .addFields({ name: 'Duration', value: musicPlayer.formatDuration(song.duration), inline: true }, { name: 'Requested by', value: `${song.requester}`, inline: true }, { name: 'Volume', value: `${queue.volume}%`, inline: true })
            .setThumbnail(song.thumbnail || null);
        if (song.uploader) {
            embed.addFields({ name: 'Channel', value: song.uploader, inline: true });
        }
        return interaction.reply({ embeds: [embed] });
    }
};
