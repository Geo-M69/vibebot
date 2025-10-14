const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const config = require('../../src/config/botConfig');

/**
 * /invite
 * Generates an OAuth2 invite link for this bot so users can add it to their servers.
 */
module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Generate an invite link to add the bot to your server.'),

    async execute(interaction) {
        // Prefer configured CLIENT_ID, fallback to the logged-in client's id
        const clientId = config.clientId || interaction.client.user?.id;

        if (!clientId) {
            return interaction.reply({ content: 'Unable to determine the bot client ID to build an invite link.', ephemeral: true });
        }

        // Scopes for adding a bot with application commands (slash commands)
        const scopes = ['bot', 'applications.commands'];

        // Default to no permission bits so server admins can pick the permissions during the invite flow.
        const permissions = 0;

        const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&permissions=${permissions}&scope=${encodeURIComponent(scopes.join(' '))}`;

        const embed = new EmbedBuilder()
            .setTitle('Invite VibeBot')
            .setDescription(`Use the button below to invite the bot to your server. If the button doesn't work, open this [link](${inviteUrl}).`)
            .setColor(0x5865F2);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Invite VibeBot')
                .setStyle(ButtonStyle.Link)
                .setURL(inviteUrl)
        );

        try {
            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: false
            });
        } catch (error) {
            console.error('Error sending invite link embed:', error);
            // Attempt a fallback ephemeral reply with plain URL
            await interaction.reply({ content: `Invite link: ${inviteUrl}`, ephemeral: true });
        }
    },
};
