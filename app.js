const pjson = require('./package.json');
require('dotenv').config();

// lib
const render = require('./lib/charts/render-chart.js');
const response = require('./lib/service/response.js');
const client = require('./lib/service/client.js');
const server = require('./lib/service/server.js');
const validation = require('./lib/service/validation.js');
const quick = require('./lib/algorithms/quick-select.js');
const insertion = require('./lib/algorithms/insertion-sort.js');
const gaussian = require('./lib/algorithms/gaussian-dist.js');

// remove later?
const bot = client.bot();

// games
var betTable = {};
var diceTable = {};

// setup
init();
var isReady = true;

// handle user commands
bot.on('message', (message) => {
    // idk why this is necessary
    if (!message.member.user)
        return;

    // ignore messages from Meat Coin
    if (message.member.user.username == 'Meat Coin')
        return;

    // check if server is busy
    if (!isReady)
        message.channel.send('`The MeatCoin server is busy. More memes = better service!`');

    // check that message has at least 1 character
    if (message.content.length == 0)
        return;

    // check that first character is a !
    if (message.content[0] != '!')
        return;

    // parse and execute appropriate command
    isReady = false;
    const splitMessage = message.content.split(' ');
    if (splitMessage.length == 1) {
        const command = splitMessage[0];
        if (command == '!help')
            help(message);
        else if (command == '!balance')
            balance(message);
        else if (command == '!history')
            history(message);
        else if (command == '!price')
            price(message);
        else if (command == '!volume')
            volume(message);
        else if (command == '!leaderboard')
            leaderboard(message);
        else if (command == '!advice')
            advice(message);
        else if (command == '!register')
            register(message);
        else if (command == '!victory')
            victory(message);
        else if (command == '!prize')
            prize(message);
    }
    else if (splitMessage.length == 2) {
        const command = splitMessage[0];
        const directive = splitMessage[1];

        if (command == '!buy')
            buy(message, directive);
        else if (command == '!sell')
            sell(message, directive);
        else if (command == '!dice' && directive == 'rules')
            diceRules(message);
        else if (command == '!flip' && directive == 'rules')
            flipRules(message);
        else if (command == '!price' && directive == 'chart')
            priceChart(message);
    }
    else if (splitMessage.length == 3) {
        const command = splitMessage[0];
        const directive = splitMessage[1];
        const coinage = splitMessage[2];

        if (command == '!flip')
            flip(message, directive, coinage);
        else if (message == '!hall of fame')
            hallOfFame(message);
        else if (command == '!send')
            sendUser(message, directive, coinage);
    }
    else if (splitMessage.length > 3) {
        const command = splitMessage[0];
        const directive = splitMessage[1];
        const username = splitMessage.slice(2, splitMessage.length - 1).join(' ');
        const coinage = splitMessage[splitMessage.length - 1];

        if (command == '!dice' && directive == 'challenge')
            diceChallenge(message, username, coinage);
        else if (command == '!dice' && directive == 'accept')
            diceAccept(message, username, coinage);
    }
    isReady = true;
});

function init() {
    console.log('MeatCoin v' + pjson.version);

    server.Data.loadSync();
    console.log('Price: ' + server.Data.price);
    console.log('Ledger: ' + JSON.stringify(server.Data.ledger, null, 2));
    console.log('');

    populateDiceTable();

    setInterval(mine, 60000);
    setInterval(fluctuate, 1000);
    setInterval(backup, 60000);

    const token = process.env.MEAT_TOKEN;
    bot.login(token);
}

function populateDiceTable() {
    diceTable['31'] = 1;
    diceTable['32'] = 2;
    diceTable['41'] = 3;
    diceTable['42'] = 4;
    diceTable['43'] = 5;
    diceTable['51'] = 6;
    diceTable['52'] = 7;
    diceTable['53'] = 8;
    diceTable['54'] = 9;
    diceTable['61'] = 10;
    diceTable['62'] = 11;
    diceTable['63'] = 12;
    diceTable['64'] = 13;
    diceTable['65'] = 14;
    diceTable['11'] = 15;
    diceTable['22'] = 16;
    diceTable['33'] = 17;
    diceTable['44'] = 18;
    diceTable['55'] = 19;
    diceTable['66'] = 20;
    diceTable['21'] = 21;
}

function mine() {
    if (!isReady)
        return

    isReady = false;

    console.log('Mining event');
    const magicNumber = Math.floor((Math.random() * Math.max(server.Stats.numMiners, 15)) + 1);
    Object.values(server.Data.ledger).forEach(trader => {
        const traderGuess = Math.floor((Math.random() * Math.max(server.Stats.numMiners, 15)) + 1);
            if (traderGuess == magicNumber) {
                const standard = gaussian.standard(server.Data.price/2, server.Data.price/2);

                const amount = Math.ceil(standard());
                trader.gold += amount;

                console.log(trader.tag + ' mined ' + amount + ' gold.');
                response.Notification.minedGold(getChannel(trader.channelId), trader.tag, amount);
            }
    });
    console.log('');

    isReady = true;
}

function fluctuate() {
    const oldPrice = server.Data.price;
    var newPrice = oldPrice;
    server.elapsedTime += 1;

    // 33% chance to go up
    // 33% chance to do down
    // 34% chance to stay the same
    const adjuster = Math.random();
    if (adjuster <= 0.32) {
        newPrice *= server.Config.volatility;
    } else if (adjuster <= 0.65) {
        newPrice /= server.Config.volatility;
    } else {
        newPrice *= 1;
    }
    newPrice += server.Config.inflation;

    server.Data.price = newPrice;
    server.Stats.priceHistory.push({'x': server.elapsedTime, 'y': newPrice, 'c': 0});

    console.log('Price: ' + newPrice);
    console.log('Fluctuate: ' + (newPrice - oldPrice));
    console.log('Total Time Market Open: ' + server.elapsedTime);
    console.log('');
}

function backup() {
    console.log('Backup begin.');
    server.Data.saveAsync();
    console.log('Backup end.\n');
}

function shutdown() {
    server.Data.saveSync();
    process.exit();
}

process.on('SIGINT', () => {
    console.log('SIGINT');
    shutdown();
});

process.on('SIGTERM', () => {
    console.log('SIGTERM');
    shutdown();
});

process.on('uncaughtException', function(err) {
    console.log(err.stack);
    shutdown();
});

process.on('exit', () => {
    console.log('exit');
});

function help(message) {
    response.Broadcast.help(message.channel);
}

function balance(message) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    response.Broadcast.balance(message.channel, trader);
}

function history(message) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    response.Broadcast.history(message.channel, trader);
}

function price(message) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    response.Broadcast.price(message.channel);
}

function priceChart(message) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    render.line_chart(server.Stats.priceHistory, function(priceChartFilePath) {
        response.Broadcast.priceChart(message.channel, priceChartFilePath, server.startTime);
    });
}

function volume(message) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    response.Broadcast.volume(message.channel);
}

function leaderboard(message) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    const traders = Object.values(server.Data.ledger);
    if (traders.length > 10)
        quick.select(traders, 10, server.Trader.hasMoreMoney);

    const leadingTraders = traders.slice(0, 10);
    insertion.sort(leadingTraders, server.Trader.hasMoreMoney, false);
    leadingTraders.reverse();

    response.Broadcast.leaderboard(message.channel, leadingTraders);
}

function advice(message) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    response.Broadcast.advice(message.channel);
}

function register(message) {
    const traderNotRegistered = validation.checkNotRegistered(message.channel, message.member.user.tag);
    if (!traderNotRegistered) return;

    const newTrader = new server.Trader(message.member.user.id, message.member.user.tag, message.member.user.username, message.channel.id, 1.0, 0, []);
    server.Data.addTrader(newTrader);

    response.Broadcast.registration(message.channel, newTrader.tag);
}

function victory(message) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    const victory = validation.checkVictory(message.channel, trader);
    if (!victory) return;

    console.log('victory: ' + trader.tag);
    response.Broadcast.victory(message.channel, trader.tag);
    shutdown();
}

function prize(message) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    response.Broadcast.prize(message.channel);
}

function buy(message, rawMeatCoinAmount) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    const meatCoinAmount = validation.checkMeatCoinAmount(message.channel, trader, rawMeatCoinAmount);
    if (!meatCoinAmount) return;

    const traderHasFunds = validation.checkGoldBalance(message.channel, trader, meatCoinAmount);
    if (!traderHasFunds) return;

    const meatCoinGoldValue = meatCoinAmount * server.Data.price;
    trader.gold -= meatCoinGoldValue;
    trader.meat += meatCoinAmount;

    if (trader.history.length > 9)
        trader.history.pop();
    trader.history.unshift('b' + ',' + meatCoinAmount.toFixed(2) + ',' + meatCoinGoldValue.toFixed(2));

    server.Stats.volume.bought += meatCoinAmount;

    response.Broadcast.bought(message.channel, trader.tag, meatCoinAmount, meatCoinGoldValue);
}

function sell(message, rawMeatCoinAmount) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    const meatCoinAmount = validation.checkMeatCoinAmount(message.channel, trader, rawMeatCoinAmount);
    if (!meatCoinAmount) return;

    const traderHasFunds = validation.checkMeatBalance(message.channel, trader, meatCoinAmount);
    if (!traderHasFunds) return;

    const meatCoinGoldValue = meatCoinAmount * server.Data.price;
    trader.gold += meatCoinGoldValue;
    trader.meat -= meatCoinAmount;

    if (trader.history.length > 9)
        trader.history.pop();
    trader.history.unshift('s' + ',' + meatCoinAmount.toFixed(2) + ',' + meatCoinGoldValue.toFixed(2));

    server.Stats.volume.sold += meatCoinAmount;

    response.Broadcast.sold(message.channel, trader.tag, meatCoinAmount, meatCoinGoldValue);
}

function diceRules(message) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    response.Broadcast.diceRules(message.channel);
}

function flipRules(message) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    response.Broadcast.flipRules(message.channel);
}

function flip(message, sideGuess, rawMeatCoinAmount) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    const isValidSide = validation.checkFlipSide(message.channel, sideGuess);
    if (!isValidSide) return;

    const meatCoinAmount = validation.checkMeatCoinAmount(message.channel, trader, rawMeatCoinAmount);
    if (!meatCoinAmount) return;

    const traderHasFunds = validation.checkMeatBalance(message.channel, trader, meatCoinAmount);
    if (!traderHasFunds) return;

    var sideServer;
    if (Math.random() > 0.5)
        sideServer = 'ribs';
    else
        sideServer = 'loins';

    const traderIsSuccessful = sideGuess == sideServer;
    if (traderIsSuccessful)
        trader.meat += meatCoinAmount;
    else
        trader.meat -= meatCoinAmount;

    server.Stats.volume.gambled += meatCoinAmount;
    server.jackpot += server.Data.price * meatCoinAmount;

    response.Broadcast.flipResult(message.channel, trader.tag, traderIsSuccessful, meatCoinAmount);
}

function hallOfFame(message) {
    const trader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!trader) return;

    response.Broadcast.hallOfFame(message.channel);
}

function diceChallenge(message, acceptorTraderTag, rawMeatCoinAmount) {
    const challengerTrader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!challengerTrader) return;

    const meatCoinAmount = validation.checkMeatCoinAmount(message.channel, challengerTrader, rawMeatCoinAmount);
    if (!meatCoinAmount) return;

    const traderHasFunds = validation.checkMeatBalance(message.channel, challengerTrader, meatCoinAmount);
    if (!traderHasFunds) return;

    const isNotSelfChallenging = validation.checkNotSelfChallenge(message.channel, challengerTrader, acceptorTraderTag);
    if (!isNotSelfChallenging) return;

    const acceptorTrader = validation.checkExistence(message.channel, acceptorTraderTag);
    if (!acceptorTrader) return;

    betTable[challengerTrader.tag] = {
        acceptor: acceptorTrader,
        bet: meatCoinAmount
    };

    response.Notification.diceChallenge(getChannel(acceptorTrader.channelId), challengerTrader.tag, acceptorTrader.id, meatCoinAmount);
}

function diceAccept(message, challengerTraderTag, rawMeatCoinAmount) {
    const acceptorTrader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!acceptorTrader) return;

    const challengerTrader = validation.checkExistence(message.channel, challengerTraderTag);
    if (!challengerTrader) return;

    const meatCoinAmount = validation.checkMeatCoinAmount(message.channel, acceptorTrader, rawMeatCoinAmount);
    if (!meatCoinAmount) return;

    const challengerHasFunds = validation.checkMeatBalance(message.channel, challengerTrader, meatCoinAmount);
    if (!challengerHasFunds) return;

    const acceptorHasFunds = validation.checkMeatBalance(message.channel, acceptorTrader, meatCoinAmount);
    if (!acceptorHasFunds) return;

    const betRequest = betTable[challengerTrader.tag];

    const doesChallengeExist = validation.checkChallengeExistence(message.channel, acceptorTrader, challengerTrader, betRequest);
    if (!doesChallengeExist) return;

    const doBetsMatch = validation.checkBetsMatch(message.channel, betRequest.bet, meatCoinAmount);
    if (!doBetsMatch) return;

    // d-d-d-d-d-duel!!!!
    // challenger roll
    const challengerRoll = diceRoll();
    response.Broadcast.diceRoll(message.channel, challengerTrader, challengerRoll);

    // rival roll with suspense
    const acceptorRoll = diceRoll();
    setTimeout(function() {
        response.Broadcast.diceRoll(message.channel, acceptorTrader, acceptorRoll);
    }, 3000);

    // calulate result with suspense
    setTimeout(function() {
        var outcome = '';
        if (diceTable[acceptorRoll] > diceTable[challengerRoll]) {
            outcome += acceptorTrader.tag + ' wins ' + meatCoinAmount + ' MeatCoin!!!';
            challengerTrader.meat -= meatCoinAmount;
            acceptorTrader.meat += meatCoinAmount;
        }
        else if (diceTable[acceptorRoll] < diceTable[challengerRoll]) {
            outcome += challengerTrader.tag + ' wins ' + meatCoinAmount + ' MeatCoin!!!';
            challengerTrader.meat += meatCoinAmount;
            acceptorTrader.meat -= meatCoinAmount;
        }
        else
            outcome += 'Tie! Whoever posts the best meme wins!';

        response.Broadcast.diceResult(message.channel, outcome);
    }, 6000);

    delete betTable[challengerTrader.tag];
    server.Stats.volume.gambled += meatCoinAmount;
    server.Stats.jackpot += server.Data.price * meatCoinAmount;
}

function diceRoll() {
    const rollA = Math.floor((Math.random() * 6) + 1)
    const rollB = Math.floor((Math.random() * 6) + 1)

    if (rollA > rollB)
        return rollA.toString() + rollB.toString();
    else
        return rollB.toString() + rollA.toString();
}

function sendUser(message, receiverTraderId, rawMeatCoinAmount) {
    const senderTrader = validation.checkRegistered(message.channel, message.member.user.tag);
    if (!senderTrader) return;

    const receiverTrader = validation.checkExistence(message.channel, receiverTraderId);
    if (!receiverTrader) return;

    const isNotSelfSending = validation.checkNotSelfSend(message.channel, senderTrader, receiverTrader);
    if (!isNotSelfSending) return;

    const meatCoinAmount = validation.checkMeatCoinAmount(message.channel, senderTrader, rawMeatCoinAmount);
    if (!meatCoinAmount) return;

    const userHasFunds = validation.checkMeatBalance(message.channel, senderTrader, meatCoinAmount);
    if (!userHasFunds) return;

    senderTrader.meat -= meatCoinAmount;
    receiverTrader.meat += meatCoinAmount;

    response.Notification.sentGift(getChannel(receiverTrader.channelId), senderTrader.tag, receiverTrader.id, meatCoinAmount);
}

function getChannel(channelId) {
    return bot.channels.get(channelId);
}