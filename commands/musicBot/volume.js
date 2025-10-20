"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const musicPlayer = require('../../src/services/musicPlayer');
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('volume')
        .setDescription('Set the music volume')
        .addIntegerOption(option => option
        .setName('level')
        .setDescription('Volume level (0-200)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(200)),
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
        if (!queue.isPlaying) {
            return interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ Nothing is playing right now!')
                ],
                ephemeral: true
            });
        }
        const volume = interaction.options.getInteger('level', true);
        const newVolume = musicPlayer.setVolume(interaction.guildId, volume);
        return interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setColor('#0099FF')
                    .setDescription(`🔊 Volume set to **${newVolume}%**`)
            ]
        });
    }
};
