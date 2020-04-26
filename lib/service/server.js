const storage = require('../data/storage.js');

const startTime = new Date();
var elapsedTime = 0;

class Data {
    static price = 1.0;
    static ledger = {};

    static addTrader(trader) {
        this.ledger[trader.tag] = trader;
    }

    static getTrader(tag) {
        return this.ledger[tag];
    }

    static doesTraderExist(tag) {
        return this.ledger[tag] != null;
    }

    static loadSync() {
        const data = storage.loadSync();
        if (data) {
            this.price = data.price;
            this.ledger = data.ledger;

            for (const value of Object.values(data.ledger)) {
                const trader = new Trader(value.id, value.tag, value.name, value.channelId, value.gold, value.meat, value.history);
                this.addTrader(trader);
            }
        }
    }

    static saveSync() {
        storage.saveSync(this.price, this.ledger);
    }

    static saveAsync() {
        storage.saveAsync(this.price, this.ledger);
    }
}

class Config {
    static tax = 0.05;
    static volatility = 1.01;
    static inflation = 0.0139;
    static goal = 1000000;
}

class Stats {
    static numMiners = 0;

    static priceHistory = [];
    
    static volume = {
        bought: 0,
        sold: 0,
        gambled: 0
    };
    
    static jackpot = 0;
}

class Trader {
    constructor(id, tag, name, channelId, gold, meat, history) {
        this.id = id;
        this.tag = tag;
        this.name = name;
        this.channelId = channelId;

        this.gold = gold;
        this.meat = meat;
        this.history = history;
    }

    value() {
        return this.gold + this.meat * Data.price; 
    }

    static hasMoreMoney(traderA, traderB) {
        if (traderA.value() > traderB.value())
            return true;
        if (traderA.value() < traderB.value())
            return false;
    }
}

module.exports = {
    Data,
    Config,
    Stats,
    Trader,
    startTime,
    elapsedTime
};