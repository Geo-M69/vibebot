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
var customCommandService = require('../../src/services/customCommandService');
var config = require('../../src/config/botConfig');
exports.default = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('removecommand')
        .setDescription('Remove a custom command and deregister its guild slash command')
        .addStringOption(function (option) {
        return option.setName('name')
            .setDescription('Name of the custom command to remove')
            .setRequired(true);
    })
        .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator),
    execute: function (interaction) {
        return __awaiter(this, void 0, void 0, function () {
            var guildId, name, removedSlash, rest, guildCommands, cmd, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        guildId = interaction.guildId;
                        if (!!guildId) return [3 /*break*/, 2];
                        return [4 /*yield*/, interaction.reply({ content: 'This command can only be used in a server.', ephemeral: true })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                    case 2:
                        name = interaction.options.getString('name', true).toLowerCase();
                        customCommandService.removeCommand(guildId, name);
                        removedSlash = false;
                        _a.label = 3;
                    case 3:
                        _a.trys.push([3, 7, , 8]);
                        rest = new discord_js_1.REST({ version: '10' }).setToken(config.token);
                        return [4 /*yield*/, rest.get(discord_js_1.Routes.applicationGuildCommands(config.clientId, guildId))];
                    case 4:
                        guildCommands = _a.sent();
                        if (!Array.isArray(guildCommands)) return [3 /*break*/, 6];
                        cmd = guildCommands.find(function (c) { return c.name === name; });
                        if (!cmd) return [3 /*break*/, 6];
                        return [4 /*yield*/, rest.delete(discord_js_1.Routes.applicationGuildCommand(config.clientId, guildId, cmd.id))];
                    case 5:
                        _a.sent();
                        removedSlash = true;
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        err_1 = _a.sent();
                        console.error('Failed to deregister guild command', err_1);
                        return [3 /*break*/, 8];
                    case 8: return [4 /*yield*/, interaction.reply({ content: removedSlash ? "Custom command '/".concat(name, "' removed and deregistered.") : "Custom command '".concat(name, "' removed from storage.").concat(removedSlash ? '' : ' (No guild slash command found/deregistered.)'), ephemeral: true })];
                    case 9:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    }
};
