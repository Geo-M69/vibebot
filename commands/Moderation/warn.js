"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warns a user.")
        .addUserOption(option => option.setName("user")
        .setDescription("User to warn.")
        .setRequired(true))
        .addStringOption(option => option.setName("reason")
        .setDescription("Reason to warn user.")
        .setRequired(false))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.BanMembers),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        }
        const targetUser = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") ?? "No reason provided";
        // ensure invoking member has permission (extra safety)
        const invoker = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!invoker || !invoker.permissions.has(discord_js_1.PermissionFlagsBits.BanMembers)) {
            return interaction.reply({ content: "You do not have permission to warn members.", ephemeral: true });
        }
        // fetch target as a guild member if present
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
        if (!targetMember) {
            return interaction.reply({ content: "That user is not in this server.", ephemeral: true });
        }
        if (targetMember.id === interaction.user.id) {
            return interaction.reply({ content: "You can't warn yourself.", ephemeral: true });
        }
        // check bot permissions / ability to warn
        const me = interaction.guild.members.me;
        if (!me || !me.permissions.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
            return interaction.reply({ content: "I don't have permission to send messages.", ephemeral: true });
        }
        if (!targetMember.manageable) {
            return interaction.reply({ content: "I cannot warn that user. They may have a higher role than me or special permissions.", ephemeral: true });
        }
        await interaction.deferReply({ ephemeral: true });
        try {
            // attempt to DM the user before warning (best-effort)
            await targetUser.send(`You have been warned in ${interaction.guild.name}.\nReason: ${reason}`).catch(() => null);
            return interaction.editReply({ content: `Warned ${targetUser.tag} (${targetUser.id}).\nReason: ${reason}` });
        }
        catch (error) {
            console.error("Error warning user:", error);
            return interaction.editReply({ content: "There was an error while trying to warn that user." });
        }
    }
};
