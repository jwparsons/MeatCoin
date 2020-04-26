const server = require('./server.js');
const response = require('./response.js');

module.exports = {
    checkRegistered: function (channel, traderTag) {
        const trader = server.Data.getTrader(traderTag);

        if (trader)
            return trader;

         response.Error.notRegistered(channel);
    },

    checkNotRegistered: function (channel, traderTag) {
        const trader = server.Data.getTrader(traderTag);

        if (!trader)
            return true;

         response.Error.alreadyRegistered(channel, traderTag);
    },

    checkVictory: function (channel, trader) {
        if (trader.gold > server.Config.goal)
            return true;

        response.Error.victoryNotReached(channel);
    },

    checkMeatCoinAmount: function (channel, trader, rawMeatCoinAmount) {
        if (rawMeatCoinAmount == 'max') {
            return (trader.gold / server.Data.price) * (1 - server.Config.tax);
        } else {
            var amount = parseFloat(rawMeatCoinAmount);
            if (isNaN(amount) || amount <= 0)
                response.Error.invalidMeatCointAmount(channel, rawMeatCoinAmount);
            else
                return amount;
        }
    },

    checkGoldBalance: function (channel, trader, amount) {
        const value = (1.0 + server.Config.tax) * (amount * server.Data.price);
        if (trader.gold >= value)
            return true;

        response.Error.insufficientGold(channel, trader.tag, value);
    },

    checkMeatBalance: function (channel, trader, amount) {
        if (trader.meat >= amount)
            return true;

        response.Error.insufficientMeat(channel, trader.tag, amount);
    },

    checkFlipSide: function (channel, side) {
        if (side == 'ribs' || side == 'loins')
            return true;

        response.Error.invalidFlipSide(channel, side);
    },

    checkNotSelfChallenge: function (channel, challengerTrader, acceptorTraderTag) {
        if (challengerTrader.tag != acceptorTraderTag)
            return true;

        response.Error.selfChallenge(channel);
    },

    checkExistence: function (channel, rivalTraderTag) {
        const trader = server.Data.getTrader(rivalTraderTag);

        if (trader)
            return trader;

        response.Error.invalidTag(channel, rivalTraderTag);      
    },

    checkChallengeExistence: function (channel, acceptorTrader, challengerTrader, betRequest) {
        if (betRequest && betRequest.acceptor.tag == acceptorTrader.tag)
            return true;

        response.Error.challengeExistence(channel, acceptorTrader, challengerTrader);
    },

    checkBetsMatch: function (channel, requestedAmount, acceptedAmount) {
        if (requestedAmount == acceptedAmount)
            return true;

        response.Error.betMatch(channel, requestedAmount);
    },

    checkNotSelfSend: function (channel, senderTrader, receiverTrader) {
        if (senderTrader.tag != receiverTrader.tag)
            return true;

        response.Error.selfSend(channel);
    },
};