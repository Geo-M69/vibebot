"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const musicPlayer = require('../../src/services/musicPlayer');
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('clearqueue')
        .setDescription('Clear all songs from the queue (keeps current song playing)'),
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
        if (queue.songs.length <= 1) {
            return interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ The queue is already empty!')
                ],
                ephemeral: true
            });
        }
        const currentSong = queue.songs[0];
        const clearedCount = queue.songs.length - 1;
        queue.songs = [currentSong];
        return interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor('#00FF00')
                    .setDescription(`🗑️ Cleared **${clearedCount}** songs from the queue`)
            ]
        });
    }
};
