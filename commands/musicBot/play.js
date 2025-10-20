"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const musicPlayer = require('../../src/services/musicPlayer');
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('play')
        .setDescription('Play music from YouTube')
        .addStringOption(option => option
        .setName('query')
        .setDescription('YouTube URL or search query')
        .setRequired(true)),
    async execute(interaction) {
        const member = interaction.member;
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
            return interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ You need to be in a voice channel to play music!')
                ],
                ephemeral: true
            });
        }
        // Check bot permissions
        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions?.has(['Connect', 'Speak'])) {
            return interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ I need **Connect** and **Speak** permissions in your voice channel!')
                ],
                ephemeral: true
            });
        }
        const query = interaction.options.getString('query', true);
        await interaction.deferReply();
        try {
            const result = await musicPlayer.play(voiceChannel, interaction.channel, query, interaction.user);
            if (result.type === 'playing') {
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('🎵 Now Playing')
                    .setDescription(`[${result.song.title}](${result.song.url})`)
                    .addFields({ name: 'Duration', value: musicPlayer.formatDuration(result.song.duration), inline: true }, { name: 'Requested by', value: `${interaction.user}`, inline: true })
                    .setThumbnail(result.song.thumbnail || null);
                if (result.song.uploader) {
                    embed.addFields({ name: 'Channel', value: result.song.uploader, inline: true });
                }
                return interaction.editReply({ embeds: [embed] });
            }
            else if (result.type === 'added') {
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor('#0099FF')
                    .setTitle('➕ Added to Queue')
                    .setDescription(`[${result.song.title}](${result.song.url})`)
                    .addFields({ name: 'Position in Queue', value: `${result.position}`, inline: true }, { name: 'Duration', value: musicPlayer.formatDuration(result.song.duration), inline: true }, { name: 'Requested by', value: `${interaction.user}`, inline: true })
                    .setThumbnail(result.song.thumbnail || null);
                return interaction.editReply({ embeds: [embed] });
            }
            else if (result.type === 'playlist') {
                const embed = new discord_js_1.EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('📃 Playlist Added')
                    .setDescription(`Added **${result.count}** songs to the queue`)
                    .addFields({ name: 'First Song', value: result.songs[0].title, inline: false }, { name: 'Requested by', value: `${interaction.user}`, inline: true });
                return interaction.editReply({ embeds: [embed] });
            }
        }
        catch (error) {
            console.error('Play command error:', error);
            return interaction.editReply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription(`❌ An error occurred: ${error.message}`)
                ]
            });
        }
    }
};
