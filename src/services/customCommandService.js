const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'customCommands.json');

function ensureDataDir() {
    try {
        if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (err) {
        logger.error('Failed to create data directory', err);
    }
}

function loadAll() {
    try {
        ensureDataDir();
        if (!fs.existsSync(FILE_PATH)) return {};
        const raw = fs.readFileSync(FILE_PATH, 'utf8');
        return JSON.parse(raw || '{}');
    } catch (err) {
        logger.error('Failed to load custom commands', err);
        return {};
    }
}

function saveAll(data) {
    try {
        ensureDataDir();
        fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        logger.error('Failed to save custom commands', err);
    }
}

module.exports = {
    getCommandsForGuild(guildId) {
        const all = loadAll();
        return all[guildId] || {};
    },

    getCommand(guildId, name) {
        const guild = this.getCommandsForGuild(guildId);
        return guild[name] || null;
    },

    setCommand(guildId, name, response) {
        const all = loadAll();
        if (!all[guildId]) all[guildId] = {};
        all[guildId][name] = response;
        saveAll(all);
    },

    removeCommand(guildId, name) {
        const all = loadAll();
        if (all[guildId] && all[guildId][name]) {
            delete all[guildId][name];
            saveAll(all);
        }
    }
};
