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
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("reddit")
        .setDescription("Sends a random, hot gif or video post from a subreddit.")
        .addStringOption(function (option) {
        return option.setName('subreddit')
            .setDescription('Subreddit to pull from (default: r/shitposting)')
            .setRequired(false);
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
            var invoker, me, channel, requested, subreddit, tokenCache, token, userAgent, url, res, txt, data, posts, candidates, chosen, embed, mediaUrl, isVideo, err_1;
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        if (!interaction.guild) {
                            return [2 /*return*/, interaction.reply({ content: "This command can only be used in a server.", ephemeral: true })];
                        }
                        return [4 /*yield*/, interaction.guild.members.fetch(interaction.user.id).catch(function () { return null; })];
                    case 1:
                        invoker = _j.sent();
                        if (!invoker || !invoker.permissions.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
                            return [2 /*return*/, interaction.reply({ content: "You do not have permission to send messages.", ephemeral: true })];
                        }
                        me = interaction.guild.members.me;
                        if (!me || !me.permissions.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
                            return [2 /*return*/, interaction.reply({ content: "I don't have permission to send messages.", ephemeral: true })];
                        }
                        channel = interaction.channel;
                        if (!channel ||
                            !channel.isTextBased() ||
                            !("send" in channel) ||
                            !channel.send) {
                            return [2 /*return*/, interaction.reply({ content: "I cannot send messages in this channel.", ephemeral: true })];
                        }
                        return [4 /*yield*/, interaction.deferReply()];
                    case 2:
                        _j.sent();
                        requested = ((_a = interaction.options.getString('subreddit')) === null || _a === void 0 ? void 0 : _a.trim()) || 'shitposting';
                        // basic subreddit validation: allow letters, numbers, -, _; length reasonable
                        if (!/^[A-Za-z0-9_\-]{1,100}$/.test(requested)) {
                            return [2 /*return*/, interaction.editReply({ content: 'Invalid subreddit name. Use alphanumeric characters, `-` or `_` only.' })];
                        }
                        subreddit = requested.replace(/^r\//i, '');
                        tokenCache = global.__redditTokenCache || {};
                        global.__redditTokenCache = tokenCache;
                        _j.label = 3;
                    case 3:
                        _j.trys.push([3, 16, , 18]);
                        return [4 /*yield*/, getRedditToken()];
                    case 4:
                        token = _j.sent();
                        userAgent = "vibebot:reddit:1.0 (by /u/".concat(process.env.REDDIT_USERNAME || "unknown", ")");
                        url = "https://oauth.reddit.com/r/".concat(encodeURIComponent(subreddit), "/hot?limit=100");
                        return [4 /*yield*/, fetch(url, {
                                headers: {
                                    "Authorization": "Bearer ".concat(token),
                                    "User-Agent": userAgent
                                }
                            })];
                    case 5:
                        res = _j.sent();
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
                        txt = _j.sent();
                        throw new Error("Reddit API error: ".concat(res.status, " ").concat(txt));
                    case 7: return [4 /*yield*/, res.json()];
                    case 8:
                        data = _j.sent();
                        posts = (((_b = data === null || data === void 0 ? void 0 : data.data) === null || _b === void 0 ? void 0 : _b.children) || []).map(function (c) { return c.data; });
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
                        if (!candidates.length) {
                            return [2 /*return*/, interaction.editReply({ content: "Couldn't find a suitable post in r/".concat(subreddit, " right now. Try another subreddit or try again later.") })];
                        }
                        chosen = candidates[Math.floor(Math.random() * candidates.length)];
                        embed = new discord_js_1.EmbedBuilder()
                            .setTitle(chosen.title || "Untitled")
                            .setURL("https://reddit.com".concat(chosen.permalink || ""))
                            .setFooter({ text: "r/".concat(subreddit, " \u2022 u/").concat(chosen.author || "unknown") });
                        mediaUrl = null;
                        if (chosen.is_video && ((_d = (_c = chosen.media) === null || _c === void 0 ? void 0 : _c.reddit_video) === null || _d === void 0 ? void 0 : _d.fallback_url)) {
                            mediaUrl = chosen.media.reddit_video.fallback_url;
                        }
                        else if (chosen.url && /\.(jpe?g|png|gif|gifv|mp4)$/i.test(chosen.url)) {
                            mediaUrl = chosen.url;
                            if (mediaUrl)
                                mediaUrl = mediaUrl.replace(/\.gifv$/i, ".gif");
                        }
                        else if ((_h = (_g = (_f = (_e = chosen.preview) === null || _e === void 0 ? void 0 : _e.images) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.source) === null || _h === void 0 ? void 0 : _h.url) {
                            mediaUrl = chosen.preview.images[0].source.url.replace(/&amp;/g, "&");
                        }
                        if (!mediaUrl) return [3 /*break*/, 13];
                        isVideo = /\.(mp4|webm)$/i.test(mediaUrl) || chosen.is_video;
                        if (!isVideo) return [3 /*break*/, 10];
                        if (chosen.thumbnail && chosen.thumbnail !== "self" && chosen.thumbnail !== "default") {
                            embed.setImage(chosen.thumbnail);
                        }
                        return [4 /*yield*/, interaction.editReply({ embeds: [embed], content: mediaUrl })];
                    case 9:
                        _j.sent();
                        return [3 /*break*/, 12];
                    case 10:
                        embed.setImage(mediaUrl);
                        return [4 /*yield*/, interaction.editReply({ embeds: [embed] })];
                    case 11:
                        _j.sent();
                        _j.label = 12;
                    case 12: return [3 /*break*/, 15];
                    case 13: 
                    // fallback: just send title + link
                    return [4 /*yield*/, interaction.editReply({
                            content: "Couldn't attach media, here's the post: https://reddit.com".concat(chosen.permalink || ""),
                            embeds: [embed]
                        })];
                    case 14:
                        // fallback: just send title + link
                        _j.sent();
                        _j.label = 15;
                    case 15: return [3 /*break*/, 18];
                    case 16:
                        err_1 = _j.sent();
                        console.error("reddit command error:", err_1);
                        return [4 /*yield*/, interaction.editReply({ content: "There was an error fetching a post from Reddit." })];
                    case 17:
                        _j.sent();
                        return [3 /*break*/, 18];
                    case 18: return [2 /*return*/];
                }
            });
        });
    }
};
