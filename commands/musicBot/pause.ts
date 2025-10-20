import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';

const musicPlayer = require('../../src/services/musicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the current song'),

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
        
        if (!queue.isPlaying) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ Nothing is playing right now!')
                ],
                ephemeral: true
            });
        }

        const success = musicPlayer.pause(interaction.guildId!);

        if (success) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FFA500')
                        .setDescription('⏸️ Paused the music')
                ]
            });
        } else {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ Failed to pause the music')
                ],
                ephemeral: true
            });
        }
    }
};
