const storage = require('./storage.js');
const server = require('../service/server.js');
const meatpot = require('../commands/meatpot.js');

module.exports = {
    save: function(price, ledger, priceHistory, meatpot, meatpotBoard, isSync) {
        const data = JSON.stringify({
            price: price,
            ledger: ledger,
            priceHistory: priceHistory,
            meatpot,
            meatpotBoard
        }, null, 2);

        if (isSync) {
            storage.saveSync(data);
        } else {
            storage.saveAsync(data);
        }
    },

    load: function(isSync) {
        if (isSync) {
            return storage.loadSync();
        } else {
            return storage.loadAsync();
        }
    }
};