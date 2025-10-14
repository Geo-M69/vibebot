
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Delete a number of messages from this channel.')
		.addIntegerOption(option =>
			option
				.setName('amount')
				.setDescription('Number of messages to delete (1-100)')
				.setRequired(true)
		),

	async execute(interaction) {
		const amount = interaction.options.getInteger('amount');

		if (!interaction.guild) {
			return interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true });
		}

		// Check member permissions (user)
		const memberPerms = interaction.member?.permissions;
		if (!memberPerms || !memberPerms.has(PermissionsBitField.Flags.ManageMessages)) {
			return interaction.reply({ content: 'You need the Manage Messages permission to use this command.', ephemeral: true });
		}

		// Check bot permissions
		const botMember = interaction.guild.members.me || interaction.guild.members.cache.get(interaction.client.user.id);
		if (!botMember || !botMember.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
			return interaction.reply({ content: "I need the Manage Messages permission to delete messages.", ephemeral: true });
		}

		if (typeof amount !== 'number' || amount < 1 || amount > 100) {
			return interaction.reply({ content: 'Please provide a number between 1 and 100.', ephemeral: true });
		}

		await interaction.deferReply({ ephemeral: true });

		try {
			// bulkDelete will ignore messages older than 14 days when filterOld is true
			const deleted = await interaction.channel.bulkDelete(amount, true);
			const deletedCount = (deleted && deleted.size) ? deleted.size : 0;

			await interaction.editReply({ content: `Deleted ${deletedCount} message(s).` });
		} catch (error) {
			console.error('Error in /clear command:', error);
			await interaction.editReply({ content: 'There was an error trying to delete messages in this channel.' });
		}
	},
};

