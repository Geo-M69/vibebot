import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kicks a user from the server.')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user', true);
        const reason = interaction.options.getString('reason') ?? 'No reason provided';

        // ensure invoking member has permission (extra safety)
        const invoker = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!invoker || !invoker.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: 'You do not have permission to kick members.', ephemeral: true });
        }

        // fetch target as a guild member if present
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: 'That user is not in this server.', ephemeral: true });
        }

        if (targetMember.id === interaction.user.id) {
            return interaction.reply({ content: "You can't kick yourself.", ephemeral: true });
        }

        // check bot permissions / ability to kick
        const me = interaction.guild.members.me;
        if (!me || !me.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({ content: "I don't have permission to kick members.", ephemeral: true });
        }

        if (!targetMember.kickable) {
            return interaction.reply({ content: 'I cannot kick that user. They may have a higher role than me or special permissions.', ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // attempt to DM the user before kicking (best-effort)
            await targetUser.send(`You have been kicked from ${interaction.guild.name}.\nReason: ${reason}`).catch(() => null);

            // perform the kick
            await targetMember.kick(reason);

            return interaction.editReply({ content: `Kicked ${targetUser.tag} (${targetUser.id}).\nReason: ${reason}` });
        } catch (error) {
            return interaction.editReply({ content: 'Failed to kick the user. Ensure my role is above the target and I have the Kick Members permission.' });
        }
    },
};