const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE_PATH = path.join(DATA_DIR, 'welcomeMessages.json');

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
        logger.error('Failed to load welcome messages', err);
        return {};
    }
}

function saveAll(data) {
    try {
        ensureDataDir();
        fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        logger.error('Failed to save welcome messages', err);
    }
}

module.exports = {
    getWelcomeMessage(guildId) {
        const all = loadAll();
        return all[guildId] || null;
    },

    setWelcomeMessage(guildId, message) {
        const all = loadAll();
        all[guildId] = message;
        saveAll(all);
    },

    clearWelcomeMessage(guildId) {
        const all = loadAll();
        if (all[guildId]) {
            delete all[guildId];
            saveAll(all);
        }
    }
};
