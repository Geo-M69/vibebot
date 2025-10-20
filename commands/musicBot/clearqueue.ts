import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';

const musicPlayer = require('../../src/services/musicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearqueue')
        .setDescription('Clear all songs from the queue (keeps current song playing)'),

    async execute(interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ You need to be in a voice channel!')
                ],
                ephemeral: true
            });
        }

        const queue = musicPlayer.getQueue(interaction.guildId!);
        
        if (queue.songs.length <= 1) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
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
                new EmbedBuilder()
                    .setColor('#00FF00')
                    .setDescription(`🗑️ Cleared **${clearedCount}** songs from the queue`)
            ]
        });
    }
};
