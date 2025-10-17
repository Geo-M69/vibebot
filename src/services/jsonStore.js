const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

const DATA_DIR = path.join(process.cwd(), 'data');

// In-memory cache of stores: filename -> { data, dirty, timer }
const stores = new Map();

async function ensureDataDir() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (err) {
        logger.error('Failed to create data directory', err);
    }
}

function filePathFor(name) {
    return path.join(DATA_DIR, name);
}

async function loadStore(name) {
    if (stores.has(name)) return stores.get(name).data;

    await ensureDataDir();
    const fp = filePathFor(name);
    try {
        const raw = await fs.readFile(fp, 'utf8');
        const data = JSON.parse(raw || '{}');
        stores.set(name, { data, dirty: false, timer: null });
        return data;
    } catch (err) {
        // If file doesn't exist, start with empty object
        if (err.code === 'ENOENT') {
            const data = {};
            stores.set(name, { data, dirty: false, timer: null });
            return data;
        }
        logger.error(`Failed to load store ${name}`, err);
        const data = {};
        stores.set(name, { data, dirty: false, timer: null });
        return data;
    }
}

function scheduleWrite(name, delay = 500) {
    const entry = stores.get(name);
    if (!entry) return;
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = setTimeout(async () => {
        try {
            const fp = filePathFor(name);
            await fs.writeFile(fp, JSON.stringify(entry.data, null, 2), 'utf8');
            entry.dirty = false;
            entry.timer = null;
        } catch (err) {
            logger.error(`Failed to write store ${name}`, err);
        }
    }, delay);
}

function createStore(name) {
    const filename = name.endsWith('.json') ? name : `${name}.json`;

    return {
        async getAll() {
            const data = await loadStore(filename);
            return data;
        },

        async get(key) {
            const data = await loadStore(filename);
            return data[key];
        },

        async set(key, value) {
            const data = await loadStore(filename);
            data[key] = value;
            const entry = stores.get(filename);
            if (entry) {
                entry.data = data;
                entry.dirty = true;
                scheduleWrite(filename);
            }
        },

        async remove(key) {
            const data = await loadStore(filename);
            if (data && Object.prototype.hasOwnProperty.call(data, key)) {
                delete data[key];
                const entry = stores.get(filename);
                if (entry) {
                    entry.data = data;
                    entry.dirty = true;
                    scheduleWrite(filename);
                }
            }
        }
    };
}

module.exports = { createStore };

// Graceful shutdown: flush any pending writes
async function flushAll() {
    const entries = Array.from(stores.entries());
    for (const [filename, entry] of entries) {
        try {
            if (entry.timer) {
                clearTimeout(entry.timer);
                entry.timer = null;
            }
            const fp = filePathFor(filename);
            await fs.writeFile(fp, JSON.stringify(entry.data, null, 2), 'utf8');
            entry.dirty = false;
        } catch (err) {
            logger.error(`Failed to flush store ${filename}`, err);
        }
    }
}

let shutdownRegistered = false;
function registerShutdownHook() {
    if (shutdownRegistered) return;
    shutdownRegistered = true;

    const handler = async (signal) => {
        try {
            logger.info(`Received ${signal}, flushing pending data to disk...`);
            await flushAll();
            logger.info('Flush complete, exiting.');
            process.exit(0);
        } catch (err) {
            logger.error('Error while flushing stores during shutdown', err);
            process.exit(1);
        }
    };

    process.on('SIGINT', () => handler('SIGINT'));
    process.on('SIGTERM', () => handler('SIGTERM'));
    process.on('beforeExit', async () => {
        try { await flushAll(); } catch (e) { logger.error('Error in beforeExit flush', e); }
    });
}

// Auto-register
registerShutdownHook();

module.exports = { createStore, flushAll };
