"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const musicPlayer = require('../../src/services/musicPlayer');
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('remove')
        .setDescription('Remove a song from the queue')
        .addIntegerOption(option => option
        .setName('position')
        .setDescription('Position of the song in the queue to remove')
        .setRequired(true)
        .setMinValue(1)),
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
        if (queue.songs.length === 0) {
            return interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ The queue is empty!')
                ],
                ephemeral: true
            });
        }
        const position = interaction.options.getInteger('position', true);
        const removed = musicPlayer.remove(interaction.guildId, position);
        if (removed) {
            return interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor('#00FF00')
                        .setDescription(`🗑️ Removed: **${removed.title}**`)
                ]
            });
        }
        else {
            return interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ Invalid position! Use `/queue` to see the queue.')
                ],
                ephemeral: true
            });
        }
    }
};
