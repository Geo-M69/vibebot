const { createStore } = require('./jsonStore');

const store = createStore('goodbyeMessages.json');

module.exports = {
    async getGoodbyeMessage(guildId) {
        const all = await store.getAll();
        return all[guildId] || null;
    },

    async setGoodbyeMessage(guildId, message) {
        const all = await store.getAll();
        all[guildId] = message;
        await store.set(guildId, all[guildId]);
    },

    async clearGoodbyeMessage(guildId) {
        const all = await store.getAll();
        if (all[guildId]) {
            delete all[guildId];
            await store.set(guildId, all[guildId] || {});
        }
    }
};
