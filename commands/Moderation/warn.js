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
        .setName("warn")
        .setDescription("Warns a user.")
        .addUserOption(function (option) {
        return option.setName("user")
            .setDescription("User to warn.")
            .setRequired(true);
    })
        .addStringOption(function (option) {
        return option.setName("reason")
            .setDescription("Reason to warn user.")
            .setRequired(false);
    })
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.BanMembers),
    execute: function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            var targetUser, reason, invoker, targetMember, me, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!interaction.guild) {
                            return [2 /*return*/, interaction.reply({ content: "This command can only be used in a server.", ephemeral: true })];
                        }
                        targetUser = interaction.options.getUser("user", true);
                        reason = (_a = interaction.options.getString("reason")) !== null && _a !== void 0 ? _a : "No reason provided";
                        return [4 /*yield*/, interaction.guild.members.fetch(interaction.user.id).catch(function () { return null; })];
                    case 1:
                        invoker = _b.sent();
                        if (!invoker || !invoker.permissions.has(discord_js_1.PermissionFlagsBits.BanMembers)) {
                            return [2 /*return*/, interaction.reply({ content: "You do not have permission to warn members.", ephemeral: true })];
                        }
                        return [4 /*yield*/, interaction.guild.members.fetch(targetUser.id).catch(function () { return null; })];
                    case 2:
                        targetMember = _b.sent();
                        if (!targetMember) {
                            return [2 /*return*/, interaction.reply({ content: "That user is not in this server.", ephemeral: true })];
                        }
                        if (targetMember.id === interaction.user.id) {
                            return [2 /*return*/, interaction.reply({ content: "You can't warn yourself.", ephemeral: true })];
                        }
                        me = interaction.guild.members.me;
                        if (!me || !me.permissions.has(discord_js_1.PermissionFlagsBits.SendMessages)) {
                            return [2 /*return*/, interaction.reply({ content: "I don't have permission to send messages.", ephemeral: true })];
                        }
                        if (!targetMember.manageable) {
                            return [2 /*return*/, interaction.reply({ content: "I cannot warn that user. They may have a higher role than me or special permissions.", ephemeral: true })];
                        }
                        return [4 /*yield*/, interaction.deferReply({ ephemeral: true })];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        _b.trys.push([4, 6, , 7]);
                        // attempt to DM the user before warning (best-effort)
                        return [4 /*yield*/, targetUser.send("You have been warned in ".concat(interaction.guild.name, ".\nReason: ").concat(reason)).catch(function () { return null; })];
                    case 5:
                        // attempt to DM the user before warning (best-effort)
                        _b.sent();
                        return [2 /*return*/, interaction.editReply({ content: "Warned ".concat(targetUser.tag, " (").concat(targetUser.id, ").\nReason: ").concat(reason) })];
                    case 6:
                        error_1 = _b.sent();
                        console.error("Error warning user:", error_1);
                        return [2 /*return*/, interaction.editReply({ content: "There was an error while trying to warn that user." })];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
};
