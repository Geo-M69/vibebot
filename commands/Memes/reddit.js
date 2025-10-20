"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const child_process_1 = require("child_process");
const crypto = __importStar(require("crypto"));
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("reddit")
        .setDescription("Sends a random, hot gif or video post from a subreddit.")
        .addStringOption(option => option.setName('subreddit')
        .setDescription('Subreddit to pull from (default: r/shitposting)')
        .setRequired(false))
        .addStringOption(option => option.setName('filter')
        .setDescription('Filter by media type (video or image/gif)')
        .setRequired(false)
        .addChoices({ name: 'video', value: 'video' }, { name: 'image/gif', value: 'image' }))
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.SendMessages),
    async execute(interaction) {
        if (!interaction.guild) {
            return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        }
        // ensure invoking member has permission (extra safety)
        const invoker = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        if (!invoker || !invoker.permissions.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
            return interaction.reply({ content: "You do not have permission to send messages.", ephemeral: true });
        }
        // check bot permissions / ability to send messages
        const me = interaction.guild.members.me;
        if (!me || !me.permissions.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
            return interaction.reply({ content: "I don't have permission to send messages.", ephemeral: true });
        }
        // We need AttachFiles to upload merged videos
        const canAttach = me.permissions.has(discord_js_1.PermissionFlagsBits.AttachFiles);
        const channel = interaction.channel;
        if (!channel ||
            !channel.isTextBased() ||
            !("send" in channel) ||
            !channel.send) {
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
        let tokenCache = global.__redditTokenCache || {};
        global.__redditTokenCache = tokenCache;
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
            const posts = (data?.data?.children || []).map((c) => c.data);
            // Filter suitable posts (non-NSFW, has media)
            // Optional filter selector
            const rawFilter = interaction.options.getString('filter')?.toLowerCase() || '';
            const filterType = rawFilter ? (rawFilter.startsWith('vid') ? 'video' : 'image') : null;
            const isVideoLikePost = (p) => {
                if (!p)
                    return false;
                if (p.is_video)
                    return true;
                if (p.media?.reddit_video)
                    return true;
                if (p.url && /\.(mp4|webm)$/i.test(p.url))
                    return true;
                if (typeof p.post_hint === 'string' && /video/i.test(p.post_hint))
                    return true;
                return false;
            };
            const isImageLikePost = (p) => {
                if (!p)
                    return false;
                if (p.post_hint === "image")
                    return true;
                if (p.url && /\.(jpe?g|png|gif|gifv)$/i.test(p.url))
                    return true;
                if (p.preview && p.preview.images && p.preview.images.length)
                    return true;
                return false;
            };
            let candidates = posts.filter((p) => {
                if (!p)
                    return false;
                if (p.over_18)
                    return false;
                if (p.is_video)
                    return true;
                if (p.post_hint === "image")
                    return true;
                if (p.url && /\.(jpe?g|png|gif|gifv|mp4)$/i.test(p.url))
                    return true;
                if (p.preview && p.preview.images && p.preview.images.length)
                    return true;
                return false;
            });
            if (filterType === 'video') {
                candidates = candidates.filter(isVideoLikePost);
            }
            else if (filterType === 'image') {
                candidates = candidates.filter(isImageLikePost);
            }
            if (!candidates.length) {
                const desc = filterType ? `${filterType} ` : '';
                return interaction.editReply({ content: `Couldn't find a suitable ${desc}post in r/${subreddit} right now. Try another subreddit or try again later.` });
            }
            const chosen = candidates[Math.floor(Math.random() * candidates.length)];
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(chosen.title || "Untitled")
                .setURL(`https://reddit.com${chosen.permalink || ""}`)
                .setFooter({ text: `r/${subreddit} • u/${chosen.author || "unknown"}` });
            // pick media
            let mediaUrl = null;
            if (chosen.is_video && chosen.media?.reddit_video?.fallback_url) {
                mediaUrl = chosen.media.reddit_video.fallback_url;
            }
            else if (chosen.url && /\.(jpe?g|png|gif|gifv|mp4)$/i.test(chosen.url)) {
                mediaUrl = chosen.url;
                if (mediaUrl)
                    mediaUrl = mediaUrl.replace(/\.gifv$/i, ".gif");
            }
            else if (chosen.preview?.images?.[0]?.source?.url) {
                mediaUrl = chosen.preview.images[0].source.url.replace(/&amp;/g, "&");
            }
            if (mediaUrl) {
                const isVideo = /\.(mp4|webm)$/i.test(mediaUrl) || chosen.is_video;
                if (isVideo) {
                    // If we cannot attach files, inform and fall back to a link
                    if (!canAttach) {
                        await interaction.editReply({
                            embeds: [embed],
                            content: `I don't have the Attach Files permission here, so I can't upload the merged video with audio. Here's the post link (Reddit's player may be video-only): ${mediaUrl}`
                        });
                        return;
                    }
                    // If video, try to download video and audio, merge via ffmpeg, and upload the file
                    if (chosen.thumbnail && chosen.thumbnail !== "self" && chosen.thumbnail !== "default") {
                        embed.setImage(chosen.thumbnail);
                    }
                    const downloadToFile = async (url, dest) => {
                        const res = await fetch(url);
                        if (!res.ok)
                            throw new Error(`Failed to download ${url}: ${res.status}`);
                        const ab = await res.arrayBuffer();
                        await fs.promises.writeFile(dest, Buffer.from(ab));
                    };
                    const deriveAudioUrlFromFallback = (fb) => {
                        try {
                            if (/DASH_\d+\.mp4/i.test(fb))
                                return fb.replace(/DASH_\d+\.mp4/i, "DASH_audio.mp4");
                            return fb.replace(/\/[^\/]+\.mp4$/i, "/DASH_audio.mp4");
                        }
                        catch {
                            return null;
                        }
                    };
                    const tmpDir = os.tmpdir();
                    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.floor(Math.random() * 10000);
                    const videoPath = path.join(tmpDir, `reddit_video_${id}.mp4`);
                    const audioPath = path.join(tmpDir, `reddit_audio_${id}.mp4`);
                    const outPath = path.join(tmpDir, `reddit_merged_${id}.mp4`);
                    let didUploadFile = false;
                    try {
                        // Prefer using DASH manifest if available (ffmpeg will mux A/V automatically)
                        const dashUrl = chosen.media?.reddit_video?.dash_url;
                        const tryFfmpegOnDash = async () => {
                            if (!dashUrl)
                                return false;
                            // ffmpeg read mpd and mux streams
                            const stderrChunks = [];
                            await new Promise((resolve, reject) => {
                                const args = [
                                    '-y',
                                    '-i', dashUrl,
                                    '-c', 'copy',
                                    '-movflags', '+faststart',
                                    outPath
                                ];
                                const ff = (0, child_process_1.spawn)('ffmpeg', args);
                                ff.stderr?.on('data', (d) => stderrChunks.push(Buffer.isBuffer(d) ? d : Buffer.from(String(d))));
                                ff.on('error', (err) => reject(err));
                                ff.on('close', (code) => {
                                    if (code === 0)
                                        resolve();
                                    else
                                        reject(new Error(`ffmpeg exited with code ${code}\n${Buffer.concat(stderrChunks).toString()}`));
                                });
                            });
                            if (!fs.existsSync(outPath))
                                return false;
                            const st = fs.statSync(outPath);
                            if (st.size <= 0)
                                return false;
                            // Size check and upload
                            const maxSize = 8 * 1024 * 1024;
                            if (st.size > maxSize) {
                                await interaction.editReply({ embeds: [embed], content: `Merged video is too large to upload (${(st.size / (1024 * 1024)).toFixed(1)} MB). Here's the post: https://reddit.com${chosen.permalink || ""}` });
                                return true;
                            }
                            await interaction.editReply({ embeds: [], files: [{ attachment: outPath, name: `${subreddit}-${id}.mp4` }], content: undefined });
                            return true;
                        };
                        let handled = false;
                        try {
                            handled = await tryFfmpegOnDash();
                        }
                        catch (e) {
                            console.error('ffmpeg dash merge failed:', e);
                        }
                        if (!handled) {
                            // Manual path: download video and try to fetch audio, then merge
                            await downloadToFile(mediaUrl, videoPath);
                            // Try to figure out audio url
                            let audioUrl = null;
                            if (dashUrl) {
                                audioUrl = dashUrl.replace(/DASH_(\d+)\.mpd$/i, 'DASH_audio.mp4');
                            }
                            if (!audioUrl && chosen.media?.reddit_video?.fallback_url) {
                                audioUrl = deriveAudioUrlFromFallback(chosen.media.reddit_video.fallback_url);
                            }
                            if (!audioUrl) {
                                const m = mediaUrl.match(/v\.redd\.it\/(\w+)\//i);
                                if (m && m[1])
                                    audioUrl = `https://v.redd.it/${m[1]}/DASH_audio.mp4`;
                            }
                            let haveAudio = false;
                            if (audioUrl) {
                                try {
                                    const resp = await fetch(audioUrl);
                                    if (resp.ok) {
                                        const ab = await resp.arrayBuffer();
                                        await fs.promises.writeFile(audioPath, Buffer.from(ab));
                                        const st = fs.statSync(audioPath);
                                        haveAudio = st.size > 0;
                                    }
                                }
                                catch {
                                    haveAudio = false;
                                }
                            }
                            if (haveAudio) {
                                // Merge with ffmpeg, capture stderr for diagnostics
                                const stderrChunks = [];
                                await new Promise((resolve, reject) => {
                                    const args = [
                                        '-y',
                                        '-i', videoPath,
                                        '-i', audioPath,
                                        '-c:v', 'copy',
                                        '-c:a', 'aac',
                                        '-map', '0:v:0',
                                        '-map', '1:a:0',
                                        '-shortest',
                                        '-movflags', '+faststart',
                                        outPath
                                    ];
                                    const ff = (0, child_process_1.spawn)('ffmpeg', args);
                                    ff.stderr?.on('data', (d) => stderrChunks.push(Buffer.isBuffer(d) ? d : Buffer.from(String(d))));
                                    ff.on('error', (err) => reject(err));
                                    ff.on('close', (code) => {
                                        if (code === 0)
                                            resolve();
                                        else
                                            reject(new Error(`ffmpeg exited with code ${code}\n${Buffer.concat(stderrChunks).toString()}`));
                                    });
                                });
                                const stats = fs.statSync(outPath);
                                const maxSize = 8 * 1024 * 1024;
                                if (stats.size > maxSize) {
                                    await interaction.editReply({ embeds: [embed], content: `Merged video is too large to upload (${(stats.size / (1024 * 1024)).toFixed(1)} MB). Here's the post: https://reddit.com${chosen.permalink || ""}` });
                                }
                                else {
                                    await interaction.editReply({ embeds: [], files: [{ attachment: outPath, name: `${subreddit}-${id}.mp4` }], content: undefined });
                                    didUploadFile = true;
                                }
                            }
                            else {
                                // No audio available; upload video-only if small enough, else link
                                const stats = fs.statSync(videoPath);
                                const maxSize = 8 * 1024 * 1024;
                                if (stats.size > maxSize) {
                                    await interaction.editReply({ embeds: [embed], content: `Video is too large to upload (${(stats.size / (1024 * 1024)).toFixed(1)} MB). Here's the post: https://reddit.com${chosen.permalink || ""}` });
                                }
                                else {
                                    await interaction.editReply({ embeds: [], files: [{ attachment: videoPath, name: `${subreddit}-${id}.mp4` }], content: undefined });
                                    didUploadFile = true;
                                }
                            }
                        }
                    }
                    catch (err) {
                        console.error('reddit video processing error:', err);
                        // Fall back to link if anything fails
                        try {
                            await interaction.editReply({ embeds: [embed], content: mediaUrl });
                        }
                        catch { }
                    }
                    finally {
                        // Cleanup temp files
                        try {
                            if (fs.existsSync(videoPath))
                                fs.unlinkSync(videoPath);
                        }
                        catch { }
                        try {
                            if (fs.existsSync(audioPath))
                                fs.unlinkSync(audioPath);
                        }
                        catch { }
                        try {
                            if (fs.existsSync(outPath))
                                fs.unlinkSync(outPath);
                        }
                        catch { }
                    }
                }
                else {
                    // Image/GIF: keep existing embed behavior
                    embed.setImage(mediaUrl);
                    await interaction.editReply({ embeds: [embed] });
                }
            }
            else {
                // fallback: just send title + link
                await interaction.editReply({
                    content: `Couldn't attach media, here's the post: https://reddit.com${chosen.permalink || ""}`,
                    embeds: [embed]
                });
            }
        }
        catch (err) {
            console.error("reddit command error:", err);
            await interaction.editReply({ content: "There was an error fetching a post from Reddit." });
        }
    }
};
