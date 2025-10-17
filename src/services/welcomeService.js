const { createStore } = require('./jsonStore');

const store = createStore('welcomeMessages.json');

module.exports = {
    async getWelcomeMessage(guildId) {
        const all = await store.getAll();
        return all[guildId] || null;
    },

    async setWelcomeMessage(guildId, message) {
        const all = await store.getAll();
        all[guildId] = message;
        await store.set(guildId, all[guildId]);
    },

    async clearWelcomeMessage(guildId) {
        const all = await store.getAll();
        if (all[guildId]) {
            delete all[guildId];
            await store.set(guildId, all[guildId] || {});
        }
    }
};
