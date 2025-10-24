import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';

const musicPlayer = require('../../src/services/musicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Set the loop mode')
        .addStringOption(option =>
            option
                .setName('mode')
                .setDescription('Loop mode')
                .setRequired(true)
                .addChoices(
                    { name: 'Off', value: 'off' },
                    { name: 'Song', value: 'song' },
                    { name: 'Queue', value: 'queue' }
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('You need to be in a voice channel!')
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
                        .setDescription('Nothing is playing right now!')
                ],
                ephemeral: true
            });
        }

        const modeStr = interaction.options.getString('mode', true);
        const mode = modeStr === 'off' ? 0 : modeStr === 'song' ? 1 : 2;
        
        musicPlayer.setLoop(interaction.guildId!, mode);

        const modeText = mode === 0 ? 'Off' : mode === 1 ? 'Song' : 'Queue';

        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor('#0099FF')
                    .setDescription(`Loop mode set to **${modeText}**`)
            ]
        });
    }
};
