import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction, EmbedBuilder } from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("reddit")
        .setDescription("Sends a random, hot gif or video post from a subreddit.")
        .addStringOption(option =>
            option.setName('subreddit')
                .setDescription('Subreddit to pull from (default: r/shitposting)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),
    async execute(interaction: ChatInputCommandInteraction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        }

        // ensure invoking member has permission (extra safety)
        const invoker = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!invoker || !invoker.permissions.has(PermissionFlagsBits.SendMessages)) {
            return interaction.reply({ content: "You do not have permission to send messages.", ephemeral: true });
        }

        // check bot permissions / ability to send messages
        const me = interaction.guild.members.me;
        if (!me || !me.permissions.has(PermissionFlagsBits.SendMessages)) {
            return interaction.reply({ content: "I don't have permission to send messages.", ephemeral: true });
        }

        const channel = interaction.channel;
        if (
            !channel ||
            !channel.isTextBased() ||
            !("send" in channel) ||
            !channel.send
        ) {
            return interaction.reply({ content: "I cannot send messages in this channel.", ephemeral: true });
        }

        await interaction.deferReply();

        const requested = interaction.options.getString('subreddit')?.trim() || 'shitposting';

        // basic subreddit validation: allow letters, numbers, -, _; length reasonable
        if (!/^[A-Za-z0-9_\-]{1,100}$/.test(requested)) {
            return interaction.editReply({ content: 'Invalid subreddit name. Use alphanumeric characters, `-` or `_` only.' });
        }

        const subreddit = requested.replace(/^r\//i, '');

        // Reddit OAuth token cache in-memory
        let tokenCache: { token?: string; expiresAt?: number } = (global as any).__redditTokenCache || {};
        (global as any).__redditTokenCache = tokenCache;

        async function getRedditToken() {
            if (tokenCache.token && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
                return tokenCache.token;
            }

            const clientId = process.env.REDDIT_CLIENT_ID;
            const clientSecret = process.env.REDDIT_SECRET;
            const username = process.env.REDDIT_USERNAME;
            const password = process.env.REDDIT_PASSWORD;

            if (!clientId || !clientSecret || !username || !password) {
                throw new Error("Reddit credentials are not set in environment variables.");
            }

            const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
            const body = new URLSearchParams({
                grant_type: "password",
                username,
                password,
            });

            const userAgent = `vibebot:reddit:1.0 (by /u/${username})`;

            const res = await fetch("https://www.reddit.com/api/v1/access_token", {
                method: "POST",
                headers: {
                    "Authorization": `Basic ${auth}`,
                    "User-Agent": userAgent,
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: body.toString()
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                throw new Error(`Failed to get Reddit token: ${res.status} ${txt}`);
            }

            const json = await res.json();
            tokenCache.token = json.access_token;
            // set expiry a bit earlier
            tokenCache.expiresAt = Date.now() + ((json.expires_in || 3600) - 60) * 1000;
            return tokenCache.token;
        }

        try {
            const token = await getRedditToken();
            const userAgent = `vibebot:reddit:1.0 (by /u/${process.env.REDDIT_USERNAME || "unknown"})`;
            const url = `https://oauth.reddit.com/r/${encodeURIComponent(subreddit)}/hot?limit=100`;
            const res = await fetch(url, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "User-Agent": userAgent
                }
            });

            if (!res.ok) {
                // handle 404 / private subreddit gracefully
                if (res.status === 404) {
                    return interaction.editReply({ content: `Subreddit r/${subreddit} not found.` });
                }
                if (res.status === 403) {
                    return interaction.editReply({ content: `I can't access r/${subreddit} (private or banned).` });
                }
                const txt = await res.text().catch(() => "");
                throw new Error(`Reddit API error: ${res.status} ${txt}`);
            }

            const data = await res.json();
            const posts = (data?.data?.children || []).map((c: any) => c.data);

            // Filter suitable posts (non-NSFW, has media)
            const candidates = posts.filter((p: any) => {
                if (!p) return false;
                if (p.over_18) return false;
                if (p.is_video) return true;
                if (p.post_hint === "image") return true;
                if (p.url && /\.(jpe?g|png|gif|gifv|mp4)$/i.test(p.url)) return true;
                if (p.preview && p.preview.images && p.preview.images.length) return true;
                return false;
            });

            if (!candidates.length) {
                return interaction.editReply({ content: `Couldn't find a suitable post in r/${subreddit} right now. Try another subreddit or try again later.` });
            }

            const chosen = candidates[Math.floor(Math.random() * candidates.length)];

            const embed = new EmbedBuilder()
                .setTitle(chosen.title || "Untitled")
                .setURL(`https://reddit.com${chosen.permalink || ""}`)
                .setFooter({ text: `r/${subreddit} • u/${chosen.author || "unknown"}` });

            // pick media
            let mediaUrl: string | null = null;

            if (chosen.is_video && chosen.media?.reddit_video?.fallback_url) {
                mediaUrl = chosen.media.reddit_video.fallback_url;
            } else if (chosen.url && /\.(jpe?g|png|gif|gifv|mp4)$/i.test(chosen.url)) {
                mediaUrl = chosen.url;
                if (mediaUrl) mediaUrl = mediaUrl.replace(/\.gifv$/i, ".gif");
            } else if (chosen.preview?.images?.[0]?.source?.url) {
                mediaUrl = chosen.preview.images[0].source.url.replace(/&amp;/g, "&");
            }

            if (mediaUrl) {
                // if it's an mp4 or video link, show it as content link and include thumbnail if available
                const isVideo = /\.(mp4|webm)$/i.test(mediaUrl) || chosen.is_video;
                if (isVideo) {
                    if (chosen.thumbnail && chosen.thumbnail !== "self" && chosen.thumbnail !== "default") {
                        embed.setImage(chosen.thumbnail);
                    }
                    await interaction.editReply({ embeds: [embed], content: mediaUrl });
                } else {
                    embed.setImage(mediaUrl);
                    await interaction.editReply({ embeds: [embed] });
                }
            } else {
                // fallback: just send title + link
                await interaction.editReply({
                    content: `Couldn't attach media, here's the post: https://reddit.com${chosen.permalink || ""}`,
                    embeds: [embed]
                });
            }
        } catch (err) {
            console.error("reddit command error:", err);
            await interaction.editReply({ content: "There was an error fetching a post from Reddit." });
        }
    }
}
