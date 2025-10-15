import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Deletes a number of messages from the current channel.")
        .addIntegerOption(option =>
            option.setName("amount")
                .setDescription("Number of messages to delete (1-100).")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        }

        const amount = interaction.options.getInteger("amount", true);

        // ensure invoking member has permission (extra safety)
        const invoker = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!invoker || !invoker.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: "You do not have permission to manage messages.", ephemeral: true });
        }

        // check bot permissions / ability to manage channel
        const me = interaction.guild.members.me;
        if (!me || !me.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({ content: "I don't have permission to manage messages.", ephemeral: true });
        }

        const channel = interaction.channel;
        if (
            !channel ||
            !channel.isTextBased() ||
            !("bulkDelete" in channel) ||
            !channel.bulkDelete
        ) {
            return interaction.reply({ content: "I cannot delete messages in this channel.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            const deletedMessages = await channel.bulkDelete(amount, true);
            const deletedCount = deletedMessages.size;

            return interaction.editReply({ content: `Deleted ${deletedCount} message(s) from this channel.` });
        } catch (error) {
            console.error("Error deleting messages:", error);
            return interaction.editReply({ content: "There was an error while trying to delete messages in this channel." });
        }
    }
}