/**
 * Replace placeholders in a template string.
 * Supported placeholders: {mention}, {user}, {guild}
 * @param {string} template
 * @param {{userTag?:string,userId?:string,guildName?:string}} ctx
 */
function formatMessage(template, ctx = {}) {
    if (!template) return template;
    return template
        .replace(/\{user\}/gi, ctx.userTag || '')
        .replace(/\{mention\}/gi, ctx.userId ? `<@${ctx.userId}>` : '')
        .replace(/\{guild\}/gi, ctx.guildName || '');
}

module.exports = { formatMessage };
