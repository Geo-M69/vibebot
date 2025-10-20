"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const musicPlayer = require('../../src/services/musicPlayer');
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop the music and clear the queue'),
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
        if (!queue.currentSong && queue.songs.length === 0) {
            return interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ Nothing is playing right now!')
                ],
                ephemeral: true
            });
        }
        musicPlayer.stop(interaction.guildId);
        return interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor('#FF0000')
                    .setDescription('⏹️ Stopped the music and cleared the queue')
            ]
        });
    }
};
