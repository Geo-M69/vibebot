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
        .setName('translate')
        .setDescription('Translate one of the last 5 messages in this channel via DeepL (interactive)'),
    execute: function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            var deeplKey, channel, fetched, messages, preview, defaultLang_1, msgRow, langRow, cancelRow, err_1, _a;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        deeplKey = process.env.DEEPL;
                        if (!deeplKey) {
                            return [2 /*return*/, interaction.reply({ content: 'DeepL API key is not configured. Please set DEEPL in the environment.', ephemeral: true })];
                        }
                        channel = interaction.channel;
                        if (!channel || !channel.isTextBased()) {
                            return [2 /*return*/, interaction.reply({ content: 'This command can only be used in a text channel.', ephemeral: true })];
                        }
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 4, , 9]);
                        return [4 /*yield*/, channel.messages.fetch({ limit: 50 })];
                    case 2:
                        fetched = _c.sent();
                        messages = Array.from(fetched.values())
                            .filter(function (m) { return typeof m.content === 'string' && m.content.trim().length > 0; })
                            .sort(function (a, b) { return b.createdTimestamp - a.createdTimestamp; })
                            .slice(0, 5);
                        if (messages.length === 0) {
                            return [2 /*return*/, interaction.reply({ content: 'No recent text messages found to translate.', ephemeral: true })];
                        }
                        preview = messages
                            .map(function (m, i) { return "".concat(i + 1, ". ").concat(truncate(m.content)); })
                            .join('\n');
                        defaultLang_1 = 'EN';
                        msgRow = (_b = new discord_js_1.ActionRowBuilder()).addComponents.apply(_b, messages.map(function (m, i) { return new discord_js_1.ButtonBuilder()
                            .setCustomId("translate:pick:".concat(interaction.user.id, ":").concat(m.id, ":").concat(defaultLang_1))
                            .setLabel(String(i + 1))
                            .setStyle(discord_js_1.ButtonStyle.Primary); }));
                        langRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.StringSelectMenuBuilder()
                            .setCustomId("translate:lang:".concat(interaction.user.id))
                            .setPlaceholder('Select target language')
                            .addOptions({ label: 'English (EN)', value: 'EN', description: 'Translate to English', default: true }, { label: 'English US (EN-US)', value: 'EN-US', description: 'Translate to English (US)' }, { label: 'English GB (EN-GB)', value: 'EN-GB', description: 'Translate to English (UK)' }, { label: 'Spanish (ES)', value: 'ES' }, { label: 'French (FR)', value: 'FR' }, { label: 'German (DE)', value: 'DE' }, { label: 'Italian (IT)', value: 'IT' }, { label: 'Portuguese (PT)', value: 'PT' }, { label: 'Portuguese BR (PT-BR)', value: 'PT-BR' }, { label: 'Dutch (NL)', value: 'NL' }, { label: 'Polish (PL)', value: 'PL' }, { label: 'Russian (RU)', value: 'RU' }, { label: 'Japanese (JA)', value: 'JA' }, { label: 'Chinese (ZH)', value: 'ZH' }));
                        cancelRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                            .setCustomId("translate:cancel:".concat(interaction.user.id))
                            .setLabel('Cancel')
                            .setStyle(discord_js_1.ButtonStyle.Secondary));
                        return [4 /*yield*/, interaction.reply({
                                content: "Select a message to translate. Use the menu to choose language.\n".concat(preview),
                                components: [msgRow, langRow, cancelRow],
                                ephemeral: true
                            })];
                    case 3:
                        _c.sent();
                        return [3 /*break*/, 9];
                    case 4:
                        err_1 = _c.sent();
                        console.error('translateMessage error:', err_1);
                        _c.label = 5;
                    case 5:
                        _c.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, interaction.reply({ content: 'An error occurred while preparing the translation list.', ephemeral: true })];
                    case 6:
                        _c.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        _a = _c.sent();
                        return [3 /*break*/, 8];
                    case 8: return [3 /*break*/, 9];
                    case 9: return [2 /*return*/];
                }
            });
        });
    }
};
function truncate(text, max) {
    if (max === void 0) { max = 80; }
    var t = text.replace(/\s+/g, ' ').trim();
    return t.length > max ? t.slice(0, max - 1) + '…' : t;
}
function clampDiscordMessage(text, max) {
    if (max === void 0) { max = 1900; }
    if (text.length <= max)
        return text;
    return text.slice(0, max - 1) + '…';
}
