"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var discord_js_1 = require("discord.js");
var fs = require("fs");
var path = require("path");
var os = require("os");
var child_process_1 = require("child_process");
var crypto = require("crypto");
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("reddit")
        .setDescription("Sends a random, hot gif or video post from a subreddit.")
        .addStringOption(function (option) {
        return option.setName('subreddit')
            .setDescription('Subreddit to pull from (default: r/shitposting)')
            .setRequired(false);
    })
        .addStringOption(function (option) {
        return option.setName('filter')
            .setDescription('Filter by media type (video or image/gif)')
            .setRequired(false)
            .addChoices({ name: 'video', value: 'video' }, { name: 'image/gif', value: 'image' });
    })
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.SendMessages),
    execute: function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            function getRedditToken() {
                return __awaiter(this, void 0, void 0, function () {
                    var clientId, clientSecret, username, password, auth, body, userAgent, res, txt, json;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                if (tokenCache.token && tokenCache.expiresAt && Date.now() < tokenCache.expiresAt) {
                                    return [2 /*return*/, tokenCache.token];
                                }
                                clientId = process.env.REDDIT_CLIENT_ID;
                                clientSecret = process.env.REDDIT_SECRET;
                                username = process.env.REDDIT_USERNAME;
                                password = process.env.REDDIT_PASSWORD;
                                if (!clientId || !clientSecret || !username || !password) {
                                    throw new Error("Reddit credentials are not set in environment variables.");
                                }
                                auth = Buffer.from("".concat(clientId, ":").concat(clientSecret)).toString("base64");
                                body = new URLSearchParams({
                                    grant_type: "password",
                                    username: username,
                                    password: password,
                                });
                                userAgent = "vibebot:reddit:1.0 (by /u/".concat(username, ")");
                                return [4 /*yield*/, fetch("https://www.reddit.com/api/v1/access_token", {
                                        method: "POST",
                                        headers: {
                                            "Authorization": "Basic ".concat(auth),
                                            "User-Agent": userAgent,
                                            "Content-Type": "application/x-www-form-urlencoded"
                                        },
                                        body: body.toString()
                                    })];
                            case 1:
                                res = _a.sent();
                                if (!!res.ok) return [3 /*break*/, 3];
                                return [4 /*yield*/, res.text().catch(function () { return ""; })];
                            case 2:
                                txt = _a.sent();
                                throw new Error("Failed to get Reddit token: ".concat(res.status, " ").concat(txt));
                            case 3: return [4 /*yield*/, res.json()];
                            case 4:
                                json = _a.sent();
                                tokenCache.token = json.access_token;
                                // set expiry a bit earlier
                                tokenCache.expiresAt = Date.now() + ((json.expires_in || 3600) - 60) * 1000;
                                return [2 /*return*/, tokenCache.token];
                        }
                    });
                });
            }
            var invoker, me, canAttach, channel, requested, subreddit, tokenCache, token, userAgent, url, res, txt, data, posts, rawFilter, filterType, isVideoLikePost, isImageLikePost, candidates, desc, chosen_1, embed_1, mediaUrl, isVideo, downloadToFile, deriveAudioUrlFromFallback, tmpDir, id_1, videoPath_1, audioPath_1, outPath_1, didUploadFile, dashUrl_1, tryFfmpegOnDash, handled, e_1, audioUrl, m, haveAudio, resp, ab, st, _a, stderrChunks_1, stats, maxSize, stats, maxSize, err_1, _b, err_2;
            var _this = this;
            var _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
            return __generator(this, function (_r) {
                switch (_r.label) {
                    case 0:
                        if (!interaction.guild) {
                            return [2 /*return*/, interaction.reply({ content: "This command can only be used in a server.", ephemeral: true })];
                        }
                        return [4 /*yield*/, interaction.guild.members.fetch(interaction.user.id).catch(function () { return null; })];
                    case 1:
                        invoker = _r.sent();
                        if (!invoker || !invoker.permissions.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
                            return [2 /*return*/, interaction.reply({ content: "You do not have permission to send messages.", ephemeral: true })];
                        }
                        me = interaction.guild.members.me;
                        if (!me || !me.permissions.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
                            return [2 /*return*/, interaction.reply({ content: "I don't have permission to send messages.", ephemeral: true })];
                        }
                        canAttach = me.permissions.has(discord_js_1.PermissionFlagsBits.AttachFiles);
                        channel = interaction.channel;
                        if (!channel ||
                            !channel.isTextBased() ||
                            !("send" in channel) ||
                            !channel.send) {
                            return [2 /*return*/, interaction.reply({ content: "I cannot send messages in this channel.", ephemeral: true })];
                        }
                        return [4 /*yield*/, interaction.deferReply()];
                    case 2:
                        _r.sent();
                        requested = ((_c = interaction.options.getString('subreddit')) === null || _c === void 0 ? void 0 : _c.trim()) || 'shitposting';
                        // basic subreddit validation: allow letters, numbers, -, _; length reasonable
                        if (!/^[A-Za-z0-9_\-]{1,100}$/.test(requested)) {
                            return [2 /*return*/, interaction.editReply({ content: 'Invalid subreddit name. Use alphanumeric characters, `-` or `_` only.' })];
                        }
                        subreddit = requested.replace(/^r\//i, '');
                        tokenCache = global.__redditTokenCache || {};
                        global.__redditTokenCache = tokenCache;
                        _r.label = 3;
                    case 3:
                        _r.trys.push([3, 47, , 49]);
                        return [4 /*yield*/, getRedditToken()];
                    case 4:
                        token = _r.sent();
                        userAgent = "vibebot:reddit:1.0 (by /u/".concat(process.env.REDDIT_USERNAME || "unknown", ")");
                        url = "https://oauth.reddit.com/r/".concat(encodeURIComponent(subreddit), "/hot?limit=100");
                        return [4 /*yield*/, fetch(url, {
                                headers: {
                                    "Authorization": "Bearer ".concat(token),
                                    "User-Agent": userAgent
                                }
                            })];
                    case 5:
                        res = _r.sent();
                        if (!!res.ok) return [3 /*break*/, 7];
                        // handle 404 / private subreddit gracefully
                        if (res.status === 404) {
                            return [2 /*return*/, interaction.editReply({ content: "Subreddit r/".concat(subreddit, " not found.") })];
                        }
                        if (res.status === 403) {
                            return [2 /*return*/, interaction.editReply({ content: "I can't access r/".concat(subreddit, " (private or banned).") })];
                        }
                        return [4 /*yield*/, res.text().catch(function () { return ""; })];
                    case 6:
                        txt = _r.sent();
                        throw new Error("Reddit API error: ".concat(res.status, " ").concat(txt));
                    case 7: return [4 /*yield*/, res.json()];
                    case 8:
                        data = _r.sent();
                        posts = (((_d = data === null || data === void 0 ? void 0 : data.data) === null || _d === void 0 ? void 0 : _d.children) || []).map(function (c) { return c.data; });
                        rawFilter = ((_e = interaction.options.getString('filter')) === null || _e === void 0 ? void 0 : _e.toLowerCase()) || '';
                        filterType = rawFilter ? (rawFilter.startsWith('vid') ? 'video' : 'image') : null;
                        isVideoLikePost = function (p) {
                            var _a;
                            if (!p)
                                return false;
                            if (p.is_video)
                                return true;
                            if ((_a = p.media) === null || _a === void 0 ? void 0 : _a.reddit_video)
                                return true;
                            if (p.url && /\.(mp4|webm)$/i.test(p.url))
                                return true;
                            if (typeof p.post_hint === 'string' && /video/i.test(p.post_hint))
                                return true;
                            return false;
                        };
                        isImageLikePost = function (p) {
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
                        candidates = posts.filter(function (p) {
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
                            desc = filterType ? "".concat(filterType, " ") : '';
                            return [2 /*return*/, interaction.editReply({ content: "Couldn't find a suitable ".concat(desc, "post in r/").concat(subreddit, " right now. Try another subreddit or try again later.") })];
                        }
                        chosen_1 = candidates[Math.floor(Math.random() * candidates.length)];
                        embed_1 = new discord_js_1.EmbedBuilder()
                            .setTitle(chosen_1.title || "Untitled")
                            .setURL("https://reddit.com".concat(chosen_1.permalink || ""))
                            .setFooter({ text: "r/".concat(subreddit, " \u2022 u/").concat(chosen_1.author || "unknown") });
                        mediaUrl = null;
                        if (chosen_1.is_video && ((_g = (_f = chosen_1.media) === null || _f === void 0 ? void 0 : _f.reddit_video) === null || _g === void 0 ? void 0 : _g.fallback_url)) {
                            mediaUrl = chosen_1.media.reddit_video.fallback_url;
                        }
                        else if (chosen_1.url && /\.(jpe?g|png|gif|gifv|mp4)$/i.test(chosen_1.url)) {
                            mediaUrl = chosen_1.url;
                            if (mediaUrl)
                                mediaUrl = mediaUrl.replace(/\.gifv$/i, ".gif");
                        }
                        else if ((_l = (_k = (_j = (_h = chosen_1.preview) === null || _h === void 0 ? void 0 : _h.images) === null || _j === void 0 ? void 0 : _j[0]) === null || _k === void 0 ? void 0 : _k.source) === null || _l === void 0 ? void 0 : _l.url) {
                            mediaUrl = chosen_1.preview.images[0].source.url.replace(/&amp;/g, "&");
                        }
                        if (!mediaUrl) return [3 /*break*/, 44];
                        isVideo = /\.(mp4|webm)$/i.test(mediaUrl) || chosen_1.is_video;
                        if (!isVideo) return [3 /*break*/, 41];
                        if (!!canAttach) return [3 /*break*/, 10];
                        return [4 /*yield*/, interaction.editReply({
                                embeds: [embed_1],
                                content: "I don't have the Attach Files permission here, so I can't upload the merged video with audio. Here's the post link (Reddit's player may be video-only): ".concat(mediaUrl)
                            })];
                    case 9:
                        _r.sent();
                        return [2 /*return*/];
                    case 10:
                        // If video, try to download video and audio, merge via ffmpeg, and upload the file
                        if (chosen_1.thumbnail && chosen_1.thumbnail !== "self" && chosen_1.thumbnail !== "default") {
                            embed_1.setImage(chosen_1.thumbnail);
                        }
                        downloadToFile = function (url, dest) { return __awaiter(_this, void 0, void 0, function () {
                            var res, ab;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, fetch(url)];
                                    case 1:
                                        res = _a.sent();
                                        if (!res.ok)
                                            throw new Error("Failed to download ".concat(url, ": ").concat(res.status));
                                        return [4 /*yield*/, res.arrayBuffer()];
                                    case 2:
                                        ab = _a.sent();
                                        return [4 /*yield*/, fs.promises.writeFile(dest, Buffer.from(ab))];
                                    case 3:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); };
                        deriveAudioUrlFromFallback = function (fb) {
                            try {
                                if (/DASH_\d+\.mp4/i.test(fb))
                                    return fb.replace(/DASH_\d+\.mp4/i, "DASH_audio.mp4");
                                return fb.replace(/\/[^\/]+\.mp4$/i, "/DASH_audio.mp4");
                            }
                            catch (_a) {
                                return null;
                            }
                        };
                        tmpDir = os.tmpdir();
                        id_1 = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.floor(Math.random() * 10000);
                        videoPath_1 = path.join(tmpDir, "reddit_video_".concat(id_1, ".mp4"));
                        audioPath_1 = path.join(tmpDir, "reddit_audio_".concat(id_1, ".mp4"));
                        outPath_1 = path.join(tmpDir, "reddit_merged_".concat(id_1, ".mp4"));
                        didUploadFile = false;
                        _r.label = 11;
                    case 11:
                        _r.trys.push([11, 34, 39, 40]);
                        dashUrl_1 = (_o = (_m = chosen_1.media) === null || _m === void 0 ? void 0 : _m.reddit_video) === null || _o === void 0 ? void 0 : _o.dash_url;
                        tryFfmpegOnDash = function () { return __awaiter(_this, void 0, void 0, function () {
                            var stderrChunks, st, maxSize;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        if (!dashUrl_1)
                                            return [2 /*return*/, false];
                                        stderrChunks = [];
                                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                                var _a;
                                                var args = [
                                                    '-y',
                                                    '-i', dashUrl_1,
                                                    '-c', 'copy',
                                                    '-movflags', '+faststart',
                                                    outPath_1
                                                ];
                                                var ff = (0, child_process_1.spawn)('ffmpeg', args);
                                                (_a = ff.stderr) === null || _a === void 0 ? void 0 : _a.on('data', function (d) { return stderrChunks.push(Buffer.isBuffer(d) ? d : Buffer.from(String(d))); });
                                                ff.on('error', function (err) { return reject(err); });
                                                ff.on('close', function (code) {
                                                    if (code === 0)
                                                        resolve();
                                                    else
                                                        reject(new Error("ffmpeg exited with code ".concat(code, "\n").concat(Buffer.concat(stderrChunks).toString())));
                                                });
                                            })];
                                    case 1:
                                        _a.sent();
                                        if (!fs.existsSync(outPath_1))
                                            return [2 /*return*/, false];
                                        st = fs.statSync(outPath_1);
                                        if (st.size <= 0)
                                            return [2 /*return*/, false];
                                        maxSize = 8 * 1024 * 1024;
                                        if (!(st.size > maxSize)) return [3 /*break*/, 3];
                                        return [4 /*yield*/, interaction.editReply({ embeds: [embed_1], content: "Merged video is too large to upload (".concat((st.size / (1024 * 1024)).toFixed(1), " MB). Here's the post: https://reddit.com").concat(chosen_1.permalink || "") })];
                                    case 2:
                                        _a.sent();
                                        return [2 /*return*/, true];
                                    case 3: return [4 /*yield*/, interaction.editReply({ embeds: [], files: [{ attachment: outPath_1, name: "".concat(subreddit, "-").concat(id_1, ".mp4") }], content: undefined })];
                                    case 4:
                                        _a.sent();
                                        return [2 /*return*/, true];
                                }
                            });
                        }); };
                        handled = false;
                        _r.label = 12;
                    case 12:
                        _r.trys.push([12, 14, , 15]);
                        return [4 /*yield*/, tryFfmpegOnDash()];
                    case 13:
                        handled = _r.sent();
                        return [3 /*break*/, 15];
                    case 14:
                        e_1 = _r.sent();
                        console.error('ffmpeg dash merge failed:', e_1);
                        return [3 /*break*/, 15];
                    case 15:
                        if (!!handled) return [3 /*break*/, 33];
                        // Manual path: download video and try to fetch audio, then merge
                        return [4 /*yield*/, downloadToFile(mediaUrl, videoPath_1)];
                    case 16:
                        // Manual path: download video and try to fetch audio, then merge
                        _r.sent();
                        audioUrl = null;
                        if (dashUrl_1) {
                            audioUrl = dashUrl_1.replace(/DASH_(\d+)\.mpd$/i, 'DASH_audio.mp4');
                        }
                        if (!audioUrl && ((_q = (_p = chosen_1.media) === null || _p === void 0 ? void 0 : _p.reddit_video) === null || _q === void 0 ? void 0 : _q.fallback_url)) {
                            audioUrl = deriveAudioUrlFromFallback(chosen_1.media.reddit_video.fallback_url);
                        }
                        if (!audioUrl) {
                            m = mediaUrl.match(/v\.redd\.it\/(\w+)\//i);
                            if (m && m[1])
                                audioUrl = "https://v.redd.it/".concat(m[1], "/DASH_audio.mp4");
                        }
                        haveAudio = false;
                        if (!audioUrl) return [3 /*break*/, 23];
                        _r.label = 17;
                    case 17:
                        _r.trys.push([17, 22, , 23]);
                        return [4 /*yield*/, fetch(audioUrl)];
                    case 18:
                        resp = _r.sent();
                        if (!resp.ok) return [3 /*break*/, 21];
                        return [4 /*yield*/, resp.arrayBuffer()];
                    case 19:
                        ab = _r.sent();
                        return [4 /*yield*/, fs.promises.writeFile(audioPath_1, Buffer.from(ab))];
                    case 20:
                        _r.sent();
                        st = fs.statSync(audioPath_1);
                        haveAudio = st.size > 0;
                        _r.label = 21;
                    case 21: return [3 /*break*/, 23];
                    case 22:
                        _a = _r.sent();
                        haveAudio = false;
                        return [3 /*break*/, 23];
                    case 23:
                        if (!haveAudio) return [3 /*break*/, 29];
                        stderrChunks_1 = [];
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                var _a;
                                var args = [
                                    '-y',
                                    '-i', videoPath_1,
                                    '-i', audioPath_1,
                                    '-c:v', 'copy',
                                    '-c:a', 'aac',
                                    '-map', '0:v:0',
                                    '-map', '1:a:0',
                                    '-shortest',
                                    '-movflags', '+faststart',
                                    outPath_1
                                ];
                                var ff = (0, child_process_1.spawn)('ffmpeg', args);
                                (_a = ff.stderr) === null || _a === void 0 ? void 0 : _a.on('data', function (d) { return stderrChunks_1.push(Buffer.isBuffer(d) ? d : Buffer.from(String(d))); });
                                ff.on('error', function (err) { return reject(err); });
                                ff.on('close', function (code) {
                                    if (code === 0)
                                        resolve();
                                    else
                                        reject(new Error("ffmpeg exited with code ".concat(code, "\n").concat(Buffer.concat(stderrChunks_1).toString())));
                                });
                            })];
                    case 24:
                        _r.sent();
                        stats = fs.statSync(outPath_1);
                        maxSize = 8 * 1024 * 1024;
                        if (!(stats.size > maxSize)) return [3 /*break*/, 26];
                        return [4 /*yield*/, interaction.editReply({ embeds: [embed_1], content: "Merged video is too large to upload (".concat((stats.size / (1024 * 1024)).toFixed(1), " MB). Here's the post: https://reddit.com").concat(chosen_1.permalink || "") })];
                    case 25:
                        _r.sent();
                        return [3 /*break*/, 28];
                    case 26: return [4 /*yield*/, interaction.editReply({ embeds: [], files: [{ attachment: outPath_1, name: "".concat(subreddit, "-").concat(id_1, ".mp4") }], content: undefined })];
                    case 27:
                        _r.sent();
                        didUploadFile = true;
                        _r.label = 28;
                    case 28: return [3 /*break*/, 33];
                    case 29:
                        stats = fs.statSync(videoPath_1);
                        maxSize = 8 * 1024 * 1024;
                        if (!(stats.size > maxSize)) return [3 /*break*/, 31];
                        return [4 /*yield*/, interaction.editReply({ embeds: [embed_1], content: "Video is too large to upload (".concat((stats.size / (1024 * 1024)).toFixed(1), " MB). Here's the post: https://reddit.com").concat(chosen_1.permalink || "") })];
                    case 30:
                        _r.sent();
                        return [3 /*break*/, 33];
                    case 31: return [4 /*yield*/, interaction.editReply({ embeds: [], files: [{ attachment: videoPath_1, name: "".concat(subreddit, "-").concat(id_1, ".mp4") }], content: undefined })];
                    case 32:
                        _r.sent();
                        didUploadFile = true;
                        _r.label = 33;
                    case 33: return [3 /*break*/, 40];
                    case 34:
                        err_1 = _r.sent();
                        console.error('reddit video processing error:', err_1);
                        _r.label = 35;
                    case 35:
                        _r.trys.push([35, 37, , 38]);
                        return [4 /*yield*/, interaction.editReply({ embeds: [embed_1], content: mediaUrl })];
                    case 36:
                        _r.sent();
                        return [3 /*break*/, 38];
                    case 37:
                        _b = _r.sent();
                        return [3 /*break*/, 38];
                    case 38: return [3 /*break*/, 40];
                    case 39:
                        // Cleanup temp files
                        try {
                            if (fs.existsSync(videoPath_1))
                                fs.unlinkSync(videoPath_1);
                        }
                        catch (_s) { }
                        try {
                            if (fs.existsSync(audioPath_1))
                                fs.unlinkSync(audioPath_1);
                        }
                        catch (_t) { }
                        try {
                            if (fs.existsSync(outPath_1))
                                fs.unlinkSync(outPath_1);
                        }
                        catch (_u) { }
                        return [7 /*endfinally*/];
                    case 40: return [3 /*break*/, 43];
                    case 41:
                        // Image/GIF: keep existing embed behavior
                        embed_1.setImage(mediaUrl);
                        return [4 /*yield*/, interaction.editReply({ embeds: [embed_1] })];
                    case 42:
                        _r.sent();
                        _r.label = 43;
                    case 43: return [3 /*break*/, 46];
                    case 44: 
                    // fallback: just send title + link
                    return [4 /*yield*/, interaction.editReply({
                            content: "Couldn't attach media, here's the post: https://reddit.com".concat(chosen_1.permalink || ""),
                            embeds: [embed_1]
                        })];
                    case 45:
                        // fallback: just send title + link
                        _r.sent();
                        _r.label = 46;
                    case 46: return [3 /*break*/, 49];
                    case 47:
                        err_2 = _r.sent();
                        console.error("reddit command error:", err_2);
                        return [4 /*yield*/, interaction.editReply({ content: "There was an error fetching a post from Reddit." })];
                    case 48:
                        _r.sent();
                        return [3 /*break*/, 49];
                    case 49: return [2 /*return*/];
                }
            });
        });
    }
};
