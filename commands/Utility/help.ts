import { 
    SlashCommandBuilder, 
    ChatInputCommandInteraction, 
    EmbedBuilder, 
    ActionRowBuilder, 
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    ComponentType,
    Collection
} from 'discord.js';

// Extend the Client type to include commands property
interface ExtendedClient {
    commands: Collection<string, any>;
}

export default {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('View all available bot commands organized by category'),

    async execute(interaction: ChatInputCommandInteraction) {
        const client = interaction.client as any as ExtendedClient;

        // Organize commands by category (based on folder structure)
        const categories: Record<string, any[]> = {
            'Music': [],
            'Moderation': [],
            'Utility': [],
            'Memes': [],
            'Custom Commands': []
        };

        // Collect all commands and categorize them
        client.commands.forEach(command => {
            const commandName = command.data.name;
            
            // Categorize based on common command names
            if (['play', 'pause', 'resume', 'stop', 'skip', 'queue', 'nowplaying', 
                 'volume', 'loop', 'shuffle', 'clearqueue', 'remove'].includes(commandName)) {
                categories['Music'].push(command);
            } else if (['kick', 'ban', 'mute', 'warn', 'purge', 'clear', 'slowmode'].includes(commandName)) {
                categories['Moderation'].push(command);
            } else if (['commandcreator', 'listcommands', 'removecommand', 'removeallcommands', 
                       'setwelcome', 'setgoodbye'].includes(commandName)) {
                categories['Custom Commands'].push(command);
            } else if (['reddit', 'shitpost'].includes(commandName)) {
                categories['Memes'].push(command);
            } else {
                categories['Utility'].push(command);
            }
        });

        // Remove empty categories
        Object.keys(categories).forEach(key => {
            if (categories[key].length === 0) {
                delete categories[key];
            }
        });

        // Create the main overview embed
        const createOverviewEmbed = () => {
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('Bot Command Help')
                .setDescription('Select a category from the dropdown menu below to view commands in that category.\n\u200b')
                .setTimestamp();

            // Add field for each category with command count
            Object.entries(categories).forEach(([category, commands]) => {
                const emoji = getCategoryEmoji(category);
                embed.addFields({
                    name: `${emoji} ${category}`,
                    value: `${commands.length} command${commands.length !== 1 ? 's' : ''}`,
                    inline: true
                });
            });

            embed.setFooter({ text: `Total Commands: ${client.commands.size}` });

            return embed;
        };

        // Create category-specific embed
        const createCategoryEmbed = (category: string) => {
            const commands = categories[category];
            const emoji = getCategoryEmoji(category);
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle(`${emoji} ${category} Commands`)
                .setDescription(`Here are all the commands in the **${category}** category:\n\u200b`)
                .setTimestamp();

            commands.forEach(command => {
                const { name, description } = command.data;
                
                // Get options info if any
                let optionsText = '';
                if (command.data.options && command.data.options.length > 0) {
                    const opts = command.data.options.map((opt: any) => {
                        const required = opt.required ? '`[required]`' : '`[optional]`';
                        return `  • **${opt.name}** ${required}: ${opt.description}`;
                    }).join('\n');
                    optionsText = `\n${opts}`;
                }

                embed.addFields({
                    name: `/${name}`,
                    value: `${description}${optionsText}\n\u200b`,
                    inline: false
                });
            });

            embed.setFooter({ text: `${commands.length} command${commands.length !== 1 ? 's' : ''} in this category` });

            return embed;
        };

        // Helper function to get emoji for categories
        function getCategoryEmoji(category: string): string {
            const emojis: Record<string, string> = {
                'Music': '🎵',
                'Moderation': '🛡️',
                'Utility': '🔧',
                'Memes': '😂',
                'Custom Commands': '⚙️'
            };
            return emojis[category] || '📁';
        }

        // Create select menu for categories
        const createSelectMenu = () => {
            const options = Object.keys(categories).map(category => ({
                label: category,
                description: `View ${categories[category].length} ${category.toLowerCase()} command${categories[category].length !== 1 ? 's' : ''}`,
                value: category,
                emoji: getCategoryEmoji(category)
            }));

            // Add "Back to Overview" option
            options.unshift({
                label: 'Overview',
                description: 'Return to the main help menu',
                value: 'overview',
                emoji: '🏠'
            });

            return new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('help_category_select')
                        .setPlaceholder('Select a category to view commands')
                        .addOptions(options)
                );
        };

        // Send initial response with overview
        const response = await interaction.reply({
            embeds: [createOverviewEmbed()],
            components: [createSelectMenu()],
            fetchReply: true
        });

        // Create collector for select menu interactions
        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 300_000 // 5 minutes
        });

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            // Only allow the user who used the command to interact
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: 'This help menu is not for you! Use `/help` to get your own.',
                    ephemeral: true
                });
            }

            const selectedCategory = i.values[0];

            if (selectedCategory === 'overview') {
                await i.update({
                    embeds: [createOverviewEmbed()],
                    components: [createSelectMenu()]
                });
            } else {
                await i.update({
                    embeds: [createCategoryEmbed(selectedCategory)],
                    components: [createSelectMenu()]
                });
            }
        });

        collector.on('end', async () => {
            // Disable the select menu when collector expires
            const disabledRow = new ActionRowBuilder<StringSelectMenuBuilder>()
                .addComponents(
                    StringSelectMenuBuilder.from(createSelectMenu().components[0])
                        .setDisabled(true)
                );

            await interaction.editReply({
                components: [disabledRow]
            }).catch(() => {}); // Ignore errors if message was deleted
        });
    },
};
