import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';

const musicPlayer = require('../../src/services/musicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Set the music volume')
        .addIntegerOption(option =>
            option
                .setName('level')
                .setDescription('Volume level (0-200)')
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(200)
        ),

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

        const volume = interaction.options.getInteger('level', true);
        const newVolume = musicPlayer.setVolume(interaction.guildId!, volume);

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('#0099FF')
                    .setDescription(`🔊 Volume set to **${newVolume}%**`)
            ]
        });
    }
};
