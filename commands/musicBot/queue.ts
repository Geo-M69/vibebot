import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder, GuildMember } from 'discord.js';

const musicPlayer = require('../../src/services/musicPlayer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current music queue'),

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
        
        if (!queue.currentSong && queue.songs.length === 0) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ The queue is empty!')
                ],
                ephemeral: true
            });
        }

        const currentSong = queue.currentSong || queue.songs[0];
        const upNext = queue.songs.slice(1, 11);

        let description = `**Now Playing:**\n[${currentSong.title}](${currentSong.url})\n`;
        description += `Duration: ${musicPlayer.formatDuration(currentSong.duration)} | Requested by: ${currentSong.requester}\n\n`;

        if (upNext.length > 0) {
            description += '**Up Next:**\n';
            upNext.forEach((song, index) => {
                description += `${index + 1}. [${song.title}](${song.url}) - ${musicPlayer.formatDuration(song.duration)}\n`;
            });

            if (queue.songs.length > 11) {
                description += `\n...and ${queue.songs.length - 11} more songs`;
            }
        } else {
            description += '**Up Next:** Nothing';
        }

        const embed = new EmbedBuilder()
            .setColor('#0099FF')
            .setTitle('🎵 Music Queue')
            .setDescription(description)
            .addFields(
                { name: 'Songs in Queue', value: `${queue.songs.length}`, inline: true },
                { name: 'Volume', value: `${queue.volume}%`, inline: true },
                { name: 'Loop', value: queue.loop === 0 ? 'Off' : queue.loop === 1 ? 'Song' : 'Queue', inline: true }
            )
            .setThumbnail(currentSong.thumbnail || null);

        return interaction.reply({ embeds: [embed] });
    }
};
