"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const musicPlayer = require('../../src/services/musicPlayer');
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Shuffle the music queue'),
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
                        .setDescription('❌ Not enough songs in the queue to shuffle!')
                ],
                ephemeral: true
            });
        }
        const success = musicPlayer.shuffle(interaction.guildId);
        if (success) {
            return interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor('#00FF00')
                        .setDescription('🔀 Queue has been shuffled!')
                ]
            });
        }
        else {
            return interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ Failed to shuffle the queue')
                ],
                ephemeral: true
            });
        }
    }
};
