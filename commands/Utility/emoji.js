const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder } = require('discord.js');

function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emoji')
        .setDescription('List emojis in this server or search for a specific emoji by name or ID.')
        .addStringOption(opt => opt.setName('query').setDescription('Emoji name or ID to search for').setRequired(false))
        .addStringOption(opt => opt.setName('filter').setDescription('Filter emojis by type').addChoices(
            { name: 'All', value: 'all' },
            { name: 'Animated only', value: 'animated' },
            { name: 'Static only', value: 'static' }
        ).setRequired(false)),

    async execute(interaction) {
        const guild = interaction.guild;
        if (!guild) return interaction.reply({ content: 'This command must be used in a server.', ephemeral: true });

    const query = interaction.options.getString('query')?.trim();
    const filterOpt = interaction.options.getString('filter') || 'all';

        // Build list of emojis
    let emojis = Array.from(guild.emojis.cache.values());

    // Apply filter option
    if (filterOpt === 'animated') emojis = emojis.filter(e => e.animated);
    if (filterOpt === 'static') emojis = emojis.filter(e => !e.animated);
        if (emojis.length === 0) {
            return interaction.reply({ content: 'This server has no custom emojis.', ephemeral: true });
        }

        // If query provided, try to find matches by id or name (exact or partial)
        if (query) {
            const byId = guild.emojis.cache.get(query.replace(/[^0-9]/g, ''));
            let matches = [];
            if (byId) matches.push(byId);

            // Name exact
            const exact = guild.emojis.cache.filter(e => e.name?.toLowerCase() === query.toLowerCase());
            matches = matches.concat(Array.from(exact.values()).filter((v, i, a) => a.indexOf(v) === i));

            // Partial match
            const partial = guild.emojis.cache.filter(e => e.name && e.name.toLowerCase().includes(query.toLowerCase()));
            matches = matches.concat(Array.from(partial.values()).filter((v) => !matches.includes(v)));

            // Deduplicate
            matches = Array.from(new Set(matches));

            if (matches.length === 0) {
                return interaction.reply({ content: `No emojis found matching 

\`${query}\``, ephemeral: true });
            }

            // If single match, show detailed view
            if (matches.length === 1) {
                const e = matches[0];
                const embed = new EmbedBuilder()
                    .setTitle(`${e.name}`)
                    .setDescription(`${e.toString()}  •  ${e.animated ? 'Animated' : 'Static'}`)
                    .setImage(e.url)
                    .setColor(0xf1c40f)
                    .addFields(
                        { name: 'Name', value: `${e.name}`, inline: true },
                        { name: 'ID', value: `${e.id}`, inline: true },
                        { name: 'Animated', value: `${e.animated ? 'Yes' : 'No'}`, inline: true }
                    );

                // creation timestamp if available
                if (e.createdTimestamp) embed.addFields({ name: 'Created', value: `<t:${Math.floor(e.createdTimestamp / 1000)}:f>`, inline: true });

                return interaction.reply({ embeds: [embed] });
            }

            // Multiple matches -> paginate and allow selecting an emoji from the page
            const pageSize = 10;
            const emojiChunks = chunkArray(matches, pageSize);
            const pagesText = emojiChunks.map(chunk => chunk.map(e => `${e.toString()} :${e.name}: • ${e.id}`));
            let page = 0;

            const buildEmbed = (p) => new EmbedBuilder()
                .setTitle(`Emoji search results for: ${query}`)
                .setColor(0xf1c40f)
                .setDescription(pagesText[p].join('\n'))
                .setFooter({ text: `Page ${p + 1}/${emojiChunks.length}` });

            // Select menu for current page (max 25 options)
            const buildSelect = (p) => new StringSelectMenuBuilder()
                .setCustomId(`em_select_${interaction.id}_${p}`)
                .setPlaceholder('Select an emoji to preview')
                .addOptions(emojiChunks[p].map(e => ({ label: (e.name || e.id).slice(0, 25), value: e.id, description: e.animated ? 'Animated' : 'Static' })));

            const prev = new ButtonBuilder().setCustomId(`em_prev_${interaction.id}`).setLabel('◀️ Prev').setStyle(ButtonStyle.Secondary).setDisabled(true);
            const next = new ButtonBuilder().setCustomId(`em_next_${interaction.id}`).setLabel('Next ▶️').setStyle(ButtonStyle.Secondary).setDisabled(emojiChunks.length <= 1);
            const rowButtons = new ActionRowBuilder().addComponents(prev, next);
            const rowSelect = new ActionRowBuilder().addComponents(buildSelect(0));

            const reply = await interaction.reply({ embeds: [buildEmbed(0)], components: emojiChunks.length > 1 ? [rowSelect, rowButtons] : [rowSelect], fetchReply: true });

            const filter = i => i.user.id === interaction.user.id && i.message.id === reply.id;
            const collector = reply.createMessageComponentCollector({ filter, time: 120000 });

            collector.on('collect', async i => {
                try {
                    if (i.isStringSelectMenu()) {
                        const selectedId = i.values[0];
                        const e = matches.find(x => x.id === selectedId);
                        if (!e) return i.reply({ content: 'Emoji not found.', ephemeral: true });

                        const previewEmbed = new EmbedBuilder()
                            .setTitle(`${e.name}`)
                            .setDescription(`${e.toString()}  •  ${e.animated ? 'Animated' : 'Static'}`)
                            .setImage(e.url)
                            .setColor(0xf1c40f)
                            .addFields(
                                { name: 'Name', value: `${e.name}`, inline: true },
                                { name: 'ID', value: `${e.id}`, inline: true },
                                { name: 'Animated', value: `${e.animated ? 'Yes' : 'No'}`, inline: true }
                            );

                        const openBtn = new ButtonBuilder().setLabel('Open Image').setStyle(ButtonStyle.Link).setURL(e.url);
                        const copyBtn = new ButtonBuilder().setCustomId(`em_copy_${interaction.id}_${e.id}`).setLabel('Copy URL').setStyle(ButtonStyle.Secondary);
                        const backBtn = new ButtonBuilder().setCustomId(`em_back_${interaction.id}_${page}`).setLabel('Back to list').setStyle(ButtonStyle.Primary);

                        await i.update({ embeds: [previewEmbed], components: [new ActionRowBuilder().addComponents(openBtn, copyBtn, backBtn)] });
                        return;
                    }

                    // Buttons
                    if (i.customId.startsWith(`em_prev_${interaction.id}`)) {
                        page = Math.max(0, page - 1);
                    } else if (i.customId.startsWith(`em_next_${interaction.id}`)) {
                        page = Math.min(emojiChunks.length - 1, page + 1);
                    } else if (i.customId.startsWith(`em_copy_${interaction.id}`)) {
                        // customId format em_copy_<interactionId>_<emojiId>
                        const parts = i.customId.split('_');
                        const emojiId = parts.slice(3).join('_');
                        const e = matches.find(x => x.id === emojiId);
                        if (!e) return i.reply({ content: 'Emoji not found.', ephemeral: true });
                        return i.reply({ content: e.url, ephemeral: true });
                    } else if (i.customId.startsWith(`em_back_${interaction.id}`)) {
                        // Return to list page encoded in customId
                        const parts = i.customId.split('_');
                        const backPage = parseInt(parts[3]) || 0;
                        page = Math.min(Math.max(0, backPage), emojiChunks.length - 1);
                        // fallthrough to update list view
                    }

                    // Update list view after prev/next/back actions
                    const newSelect = buildSelect(page);
                    const newPrev = ButtonBuilder.from(prev).setDisabled(page === 0);
                    const newNext = ButtonBuilder.from(next).setDisabled(page === emojiChunks.length - 1);
                    const newRowSelect = new ActionRowBuilder().addComponents(newSelect);
                    const newRowButtons = new ActionRowBuilder().addComponents(newPrev, newNext);

                    await i.update({ embeds: [buildEmbed(page)], components: emojiChunks.length > 1 ? [newRowSelect, newRowButtons] : [newRowSelect] });
                } catch (err) {
                    console.error('Error handling component interaction:', err);
                }
            });

            collector.on('end', async () => {
                try {
                    await interaction.editReply({ components: [] });
                } catch (err) { /* ignore */ }
            });

            return;
        }

        // No query: list all server emojis paginated
        // Paginate full emoji list and include a select menu to preview emojis
        const pageSize = 15;
        const emojiChunks = chunkArray(emojis, pageSize);
        const pagesText = emojiChunks.map(chunk => chunk.map(e => `${e.toString()} :${e.name}: • ${e.id}`));
        let page = 0;

        const buildEmbed = (p) => new EmbedBuilder()
            .setTitle(`${guild.name} — Emojis (${emojis.length})`)
            .setColor(0xf1c40f)
            .setDescription(pagesText[p].join('\n'))
            .setFooter({ text: `Page ${p + 1}/${emojiChunks.length}` });

        const buildSelect = (p) => new StringSelectMenuBuilder()
            .setCustomId(`em_select_${interaction.id}_${p}`)
            .setPlaceholder('Select an emoji to preview')
            .addOptions(emojiChunks[p].map(e => ({ label: (e.name || e.id).slice(0, 25), value: e.id, description: e.animated ? 'Animated' : 'Static' })));

        const prevBtn = new ButtonBuilder().setCustomId(`em_prev_${interaction.id}`).setLabel('◀️ Prev').setStyle(ButtonStyle.Secondary).setDisabled(true);
        const nextBtn = new ButtonBuilder().setCustomId(`em_next_${interaction.id}`).setLabel('Next ▶️').setStyle(ButtonStyle.Secondary).setDisabled(emojiChunks.length <= 1);
        const rowButtons = new ActionRowBuilder().addComponents(prevBtn, nextBtn);
        const rowSelect = new ActionRowBuilder().addComponents(buildSelect(0));

        const reply = await interaction.reply({ embeds: [buildEmbed(0)], components: emojiChunks.length > 1 ? [rowSelect, rowButtons] : [rowSelect], fetchReply: true });

        const filter = i => i.user.id === interaction.user.id && i.message.id === reply.id;
        const collector = reply.createMessageComponentCollector({ filter, time: 120000 });

        collector.on('collect', async i => {
            try {
                if (i.isStringSelectMenu()) {
                    const selectedId = i.values[0];
                    const e = emojis.find(x => x.id === selectedId);
                    if (!e) return i.reply({ content: 'Emoji not found.', ephemeral: true });

                    const previewEmbed = new EmbedBuilder()
                        .setTitle(`${e.name}`)
                        .setDescription(`${e.toString()}  •  ${e.animated ? 'Animated' : 'Static'}`)
                        .setImage(e.url)
                        .setColor(0xf1c40f)
                        .addFields(
                            { name: 'Name', value: `${e.name}`, inline: true },
                            { name: 'ID', value: `${e.id}`, inline: true },
                            { name: 'Animated', value: `${e.animated ? 'Yes' : 'No'}`, inline: true }
                        );

                    const openBtn = new ButtonBuilder().setLabel('Open Image').setStyle(ButtonStyle.Link).setURL(e.url);
                    const copyBtn = new ButtonBuilder().setCustomId(`em_copy_${interaction.id}_${e.id}`).setLabel('Copy URL').setStyle(ButtonStyle.Secondary);
                    const backBtn = new ButtonBuilder().setCustomId(`em_back_${interaction.id}_${page}`).setLabel('Back to list').setStyle(ButtonStyle.Primary);

                    await i.update({ embeds: [previewEmbed], components: [new ActionRowBuilder().addComponents(openBtn, copyBtn, backBtn)] });
                    return;
                }

                if (i.customId.startsWith(`em_prev_${interaction.id}`)) {
                    page = Math.max(0, page - 1);
                } else if (i.customId.startsWith(`em_next_${interaction.id}`)) {
                    page = Math.min(emojiChunks.length - 1, page + 1);
                } else if (i.customId.startsWith(`em_copy_${interaction.id}`)) {
                    const parts = i.customId.split('_');
                    const emojiId = parts.slice(3).join('_');
                    const e = emojis.find(x => x.id === emojiId);
                    if (!e) return i.reply({ content: 'Emoji not found.', ephemeral: true });
                    return i.reply({ content: e.url, ephemeral: true });
                } else if (i.customId.startsWith(`em_back_${interaction.id}`)) {
                    const parts = i.customId.split('_');
                    const backPage = parseInt(parts[3]) || 0;
                    page = Math.min(Math.max(0, backPage), emojiChunks.length - 1);
                }

                const newSelect = buildSelect(page);
                const newPrev = ButtonBuilder.from(prevBtn).setDisabled(page === 0);
                const newNext = ButtonBuilder.from(nextBtn).setDisabled(page === emojiChunks.length - 1);
                const newRowSelect = new ActionRowBuilder().addComponents(newSelect);
                const newRowButtons = new ActionRowBuilder().addComponents(newPrev, newNext);

                await i.update({ embeds: [buildEmbed(page)], components: emojiChunks.length > 1 ? [newRowSelect, newRowButtons] : [newRowSelect] });
            } catch (err) {
                console.error('Error handling component interaction:', err);
            }
        });

        collector.on('end', async () => {
            try {
                await interaction.editReply({ components: [] });
            } catch (err) { /* ignore */ }
        });
    }
};
