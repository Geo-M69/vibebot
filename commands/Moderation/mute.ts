import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Mutes a user for a set time or permanently.")
        .addUserOption(option =>
            option.setName("user")
            .setDescription("User to mute.")
            .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
            .setDescription("Reason to mute user.")
            .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        }

        const targetUser = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") ?? "No reason provided";

        // ensure invoking member has permission (extra safety)
        const invoker = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!invoker || !invoker.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: "You do not have permission to mute members.", ephemeral: true });
        }

        // fetch target as a guild member if present
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: "That user is not in this server.", ephemeral: true });
        }

        if (targetMember.id === interaction.user.id) {
            return interaction.reply({ content: "You can't mute yourself.", ephemeral: true });
        }

        // check bot permissions / ability to mute
        const me = interaction.guild.members.me;
        if (!me || !me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({ content: "I don't have permission to mute members.", ephemeral: true });
        }

        if (!targetMember.moderatable) {
            return interaction.reply({ content: "I cannot mute that user. They may have a higher role than me or special permissions.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // attempt to DM the user before muting (best-effort)
            await targetUser.send(`You have been muted in ${interaction.guild.name}.\nReason: ${reason}`).catch(() => null);

            // perform the mute
            await targetMember.timeout(null, reason);

            return interaction.editReply({ content: `Muted ${targetUser.tag} (${targetUser.id}).\nReason: ${reason}` });
        } catch (error) {
            console.error("Error muting user:", error);
            return interaction.editReply({ content: "There was an error muting that user." });
        }
    }
}