const discord = require('discord.js');

const client = new discord.Client();

module.exports = {
    bot: function () {
        return client;
    }
};