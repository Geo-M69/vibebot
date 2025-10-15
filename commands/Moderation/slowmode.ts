import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("slowmode")
        .setDescription("Sets a channel's slowmode.")
        .addIntegerOption(option =>
            option.setName("seconds")
                .setDescription("Number of seconds for slowmode (0 to disable). Max 21600.")
                .setRequired(true)
                .setMinValue(0)
                .setMaxValue(21600))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        }

        const seconds = interaction.options.getInteger("seconds", true);

        // ensure invoking member has permission (extra safety)
        const invoker = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!invoker || !invoker.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: "You do not have permission to manage channels.", ephemeral: true });
        }

        // check bot permissions / ability to manage channel
        const me = interaction.guild.members.me;
        if (!me || !me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: "I don't have permission to manage channels.", ephemeral: true });
        }

        const channel = interaction.channel;
        if (
            !channel ||
            !channel.isTextBased() ||
            !("manageable" in channel) ||
            !channel.manageable
        ) {
            return interaction.reply({ content: "I cannot set slowmode in this channel.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            await channel.setRateLimitPerUser(seconds, `Slowmode set by ${interaction.user.tag} (${interaction.user.id})`);

            return interaction.editReply({ content: `Set slowmode in this channel to ${seconds} second(s).` });
        } catch (error) {
            console.error("Error setting slowmode:", error);
            return interaction.editReply({ content: "There was an error while trying to set slowmode in this channel." });
        }
    }
}