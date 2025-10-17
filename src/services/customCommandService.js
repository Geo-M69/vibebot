const { createStore } = require('./jsonStore');

const store = createStore('customCommands.json');

module.exports = {
    async getCommandsForGuild(guildId) {
        const all = await store.getAll();
        return all[guildId] || {};
    },

    async getCommand(guildId, name) {
        const guild = await this.getCommandsForGuild(guildId);
        return guild[name] || null;
    },

    async setCommand(guildId, name, response) {
        const all = await store.getAll();
        if (!all[guildId]) all[guildId] = {};
        all[guildId][name] = response;
        await store.set(guildId, all[guildId]);
    },

    async removeCommand(guildId, name) {
        const all = await store.getAll();
        if (all[guildId] && all[guildId][name]) {
            delete all[guildId][name];
            await store.set(guildId, all[guildId]);
        }
    }
};
