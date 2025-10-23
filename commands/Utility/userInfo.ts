import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, GuildMember, User } from 'discord.js';

function formatTimestamp(ms: number | null): string {
	if (!ms) return 'Unknown';
	return `<t:${Math.floor(ms / 1000)}:f> (<t:${Math.floor(ms / 1000)}:R>)`;
}

const FLAG_MAP: Record<string, string> = {
	DISCORD_EMPLOYEE: 'Discord Employee',
	PARTNERED_SERVER_OWNER: 'Partnered Server Owner',
	HYPESQUAD_EVENTS: 'HypeSquad Events',
	HOUSE_BRAVERY: 'HypeSquad Bravery',
	HOUSE_BRILLIANCE: 'HypeSquad Brilliance',
	HOUSE_BALANCE: 'HypeSquad Balance',
	EARLY_SUPPORTER: 'Early Supporter',
	TEAM_USER: 'Team User',
	SYSTEM: 'System',
	VERIFIED_BOT: 'Verified Bot',
	VERIFIED_DEVELOPER: 'Early Verified Bot Developer',
	BUGHUNTER_LEVEL_1: 'Bug Hunter (Level 1)',
	BUGHUNTER_LEVEL_2: 'Bug Hunter (Level 2)'
};

export default {
	data: new SlashCommandBuilder()
		.setName('userinfo')
		.setDescription('Display information about a user.')
		.addUserOption(option => option.setName('user').setDescription('The user to look up').setRequired(false)),

	async execute(interaction: ChatInputCommandInteraction) {
		const target = interaction.options.getUser('user') || interaction.user;

		// Try to fetch the full user to get flags/badges
		let fullUser: User = target;
		try {
			fullUser = await interaction.client.users.fetch(target.id, { force: false });
		} catch (err) {
			// fallback to partial target
		}

		const member: GuildMember | null = interaction.guild ? interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(() => null) : null;

		const embed = new EmbedBuilder()
			.setTitle(`${target.tag} — User Info`)
			.setThumbnail(target.displayAvatarURL?.({ size: 256 }) || null)
			.setColor(0x0099ff)
			.addFields(
				{ name: 'User ID', value: `${target.id}`, inline: true },
				{ name: 'Bot', value: `${target.bot ? 'Yes' : 'No'}`, inline: true },
				{ name: 'Account Created', value: formatTimestamp(target.createdTimestamp), inline: true }
			);

		// Badges / flags
		try {
			const flags = fullUser.flags?.toArray?.() || [];
			const friendly = flags.map(f => FLAG_MAP[f] || f);
			embed.addFields({ name: 'Badges', value: friendly.length ? friendly.join(', ') : 'None', inline: false });
		} catch (err) {
			embed.addFields({ name: 'Badges', value: 'Unknown', inline: false });
		}

		// If member in guild, add server-specific info and roles (with pagination)
		if (member) {
			const presence = member.presence;
			const status = presence?.status ? presence.status : 'offline';

			embed.addFields(
				{ name: 'Server Join Date', value: formatTimestamp(member.joinedTimestamp), inline: true },
				{ name: 'Top Role', value: `${member.roles.highest?.name || 'None'}`, inline: true },
				{ name: 'Status', value: `${status}`, inline: true }
			);

			// Prepare roles for pagination (exclude @everyone)
			const roles = member.roles.cache
				.filter(r => r.id !== interaction.guild!.id)
				.sort((a, b) => b.position - a.position)
				.map(r => r.toString());

			const pageSize = 10;
			const totalPages = Math.max(1, Math.ceil(Math.max(roles.length, 1) / pageSize));
			let page = 0;

			const getRolesPage = (p: number): string => {
				if (roles.length === 0) return 'None';
				const start = p * pageSize;
				const slice = roles.slice(start, start + pageSize);
				return slice.join(', ') + (start + pageSize < roles.length ? ` and ${roles.length - (start + pageSize)} more...` : '');
			};

			// Add initial Roles field (first page)
			embed.addFields({ name: 'Roles', value: getRolesPage(page), inline: false });

			// Buttons for pagination only if more than one page
			const prevButton = new ButtonBuilder()
				.setCustomId(`roles_prev_${interaction.id}`)
				.setLabel('◀️ Previous')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(true);

			const nextButton = new ButtonBuilder()
				.setCustomId(`roles_next_${interaction.id}`)
				.setLabel('Next ▶️')
				.setStyle(ButtonStyle.Secondary)
				.setDisabled(totalPages <= 1);

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton, nextButton);

			// Send initial reply
			let reply;
			try {
				reply = await interaction.reply({ embeds: [embed], components: totalPages > 1 ? [row] : [], fetchReply: true });
			} catch (error) {
				console.error('Error sending /userinfo reply:', error);
				return interaction.reply({ content: `User: ${target.tag}\nID: ${target.id}`, ephemeral: true });
			}

			if (totalPages > 1) {
				const filter = (i: any) => i.user.id === interaction.user.id && i.message.id === reply.id;
				const collector = reply.createMessageComponentCollector({ filter, componentType: ComponentType.Button, time: 120000 });

				collector.on('collect', async (i) => {
					// update page based on which button
					if (i.customId === `roles_prev_${interaction.id}`) {
						page = Math.max(0, page - 1);
					} else if (i.customId === `roles_next_${interaction.id}`) {
						page = Math.min(totalPages - 1, page + 1);
					}

					// Edit embed's Roles field
					const newEmbed = EmbedBuilder.from(embed);
					// replace the Roles field (find index)
					const fields = newEmbed.data.fields ? [...newEmbed.data.fields] : [];
					const rolesFieldIndex = fields.findIndex(f => f.name === 'Roles');
					const rolesValue = getRolesPage(page);
					const newField = { name: 'Roles', value: rolesValue, inline: false };

					if (rolesFieldIndex >= 0) fields[rolesFieldIndex] = newField;
					else fields.push(newField);

					newEmbed.setFields(fields);

					// Update buttons disabled state
					const newPrev = ButtonBuilder.from(prevButton).setDisabled(page === 0);
					const newNext = ButtonBuilder.from(nextButton).setDisabled(page === totalPages - 1);
					const newRow = new ActionRowBuilder<ButtonBuilder>().addComponents(newPrev, newNext);

					try {
						await i.update({ embeds: [newEmbed], components: [newRow] });
					} catch (err) {
						console.error('Failed to update roles pagination:', err);
					}
				});

				collector.on('end', async () => {
					// disable buttons after timeout
					try {
						const disabledPrev = ButtonBuilder.from(prevButton).setDisabled(true);
						const disabledNext = ButtonBuilder.from(nextButton).setDisabled(true);
						const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(disabledPrev, disabledNext);
						await interaction.editReply({ components: [disabledRow] });
					} catch (err) {
						// ignore
					}
				});
			}

			return;
		}

		// If not a guild member, just reply with the embed (no roles)
		try {
			await interaction.reply({ embeds: [embed], ephemeral: false });
		} catch (error) {
			console.error('Error sending /userinfo reply:', error);
			await interaction.reply({ content: `User: ${target.tag}\nID: ${target.id}`, ephemeral: true });
		}
	}
};
