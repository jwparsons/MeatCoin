// https://discordapp.com/api/oauth2/authorize?client_id=403850021293785088&scope=bot&permissions=1

const fs = require('fs');
const Discord = require('discord.js');
const bot = new Discord.Client();

// constants
const fee = 0.05;

// user data
var ledger = {};
var betTable = {};
var diceTable = {};

// statistics
var price;
var inflation;
var volume = {
    bought: 0.0,
    sold: 0.0,
    gambled: 0.0
};

// setup
init();
var isReady = true;

// handle user commands
bot.on('message', (message) => {
    // ignore messages from Meat Coin
    if (message.member.user.username == "Meat Coin")
        return;

    // check if server is busy
    if (!isReady)
        message.channel.send('`The MeatCoin server is busy. More memes = better service!`');

    // parse and execute appropriate command
    isReady = false;
    const splitMessage = message.content.split(' ');
    if (splitMessage.length == 1) {
        const command = splitMessage[0];
        if (command == '!help')
            help(message);
        else if (command == '!version')
            version(message);
        else if (command == '!register')
            register(message);
        else if (command == '!balance')
            balance(message);
        else if (command == '!history')
            history(message);
        else if (command == '!price')
            price(message);
        else if (command == '!fee')
            fee(message);
        else if (command == '!volume')
            volume(message);
        else if (command == '!inflation')
            inflation(message);
        else if (command == '!leaderboard')
            leaderboard(message);
        else if (command == '!advice')
            advice(messsage);
    }
    else if (splitMessage.length == 2) {
        const command = splitMessage[0];
        const directive = splitMessage[1];
        if (command == '!mine' && directive == 'start')
            mineStart(message);
        else if (command == '!mine' && directive == 'stop')
            mineStop(message);
        else if (command == '!buy')
            buy(message, directive);
        else if (command == '!sell')
            sell(message, directive);
        else if (command == '!dice' && directive == 'rules')
            diceRules(message);
    }
    else if (splitMessage.length == 3) {
        const command = splitMessage[0];
        const directive = splitMessage[1];
        const coinage = splitMessage[2];

        if (command == '!mcflip')
            mcFlip(message, directive, coinage);
    }
    else if (splitMessage.length > 3) {
        const command = splitMessage[0];
        const directive = splitMessage[1];
        const username = splitMessage.slice(2, splitMessage.length - 2).join(' ');
        const coinage = splitMessage[splitMessage.length - 1];

        if (command == '!dice' && directive == 'challenge')
            diceChallenge(message, username, coinage);
        else if (command == '!dice' && directive == 'accept')
            diceAccept(message, username, coinage);
        else if (command == '!send' && directive == 'user')
            sendUser(message, username, coinage);
    }
    isReady = true;
});

bot.login('NDAzODUwMDIxMjkzNzg1MDg4.DUNWXg.gZO0tw4YCHk9SjamhoYgJn89quY');
setInterval(mine, 60000);
setInterval(mediumFluctuate, 37000);
setInterval(smallFluctuate, 17000);

function init() {
    parseLedger();
    parsePrice();
    populateDiceTable();
}

function parseLedger() {
    var path = process.cwd();
    var buffer = fs.readFileSync(path + "\\ledger.txt");
    var lines = buffer.toString().split("\n");
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].replace('\r', '');
        if (line.length > 0) {
            var data = line.split('\t');

            var userHistory = [];
            if (data.length == 5)
                userHistory = data[4].split(':');

            var userData = {
                username: data[1],
                gold: parseFloat(data[2]),
                meatCoin: parseFloat(data[3]),
                isMining: false,
                channel: null,
                history: userHistory
            };
            ledger[data[0]] = userData;
        }
    }
}

function parsePrice() {
    const path = process.cwd();
    const buffer = fs.readFileSync(path + "\\price.txt").toString().split('\n');

    price = parseFloat(buffer[0].toString());
    inflation = parseFloat(buffer[1].toString());
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
    const magicNumber = Math.floor((Math.random() * 10) + 1);
    var userData;
    var userGuess;
    Object.keys(ledger).forEach(function(key) {
        userData = ledger[key];
        if (userData.isMining == true) {
            userGuess = Math.floor((Math.random() * 10) + 1);
            if (userGuess == magicNumber) {
                const reward = Math.floor((Math.random() * (10 + inflation)) + 1);
                var response = '<@' + key + '>' + ', you have mined ' + reward + ' gold!!!';
                userData.gold += reward;
                userData.channel.send(response);
            }
        }
    });
    bigFluctuate();
    isReady = true;
}

function bigFluctuate() {
    if (Math.random() > 0.5)
        price /= (1 - Math.random()/10.0);
    else
        price *= (1 - Math.random()/10.0);
}

function mediumFluctuate() {
    if (Math.random() > 0.5)
        price /= (1 - Math.random()/100.0);
    else
        price *= (1 - Math.random()/100.0);
}

function smallFluctuate() {
    if (Math.random() > 0.5)
        price /= (1 - Math.random()/1000.0);
    else
        price *= (1 - Math.random()/1000.0);
}

function saveUserData(path) {
    var userDataBuffer = '';
    var userData;
    if (Object.keys(ledger).length > 0) {
        Object.keys(ledger).forEach(function(key) {
            userData = ledger[key];
            userDataBuffer += key;
            userDataBuffer += '\t';
            userDataBuffer += userData.username;
            userDataBuffer += '\t';
            userDataBuffer += userData.gold.toFixed(2);
            userDataBuffer += '\t';
            userDataBuffer += userData.meatCoin.toFixed(2);

            if (userData.history.length > 0) {
                userDataBuffer += '\t';
                for (var i = 0; i < userData.history.length; i++) {
                    userDataBuffer += userData.history[i];
                    if (i == userData.history.length - 1)
                        userDataBuffer += '\n';
                    else
                        userDataBuffer += ':';
                }
            }
            else
                userDataBuffer += '\n';
        });

        userDataBuffer = userDataBuffer.substring(0, userDataBuffer.length - 1);
        fs.writeFileSync(path + "\\ledger.txt", userDataBuffer, function(err) {
        }); 
    }
}

function savePriceData(path) {
    var priceDataBuffer = '';
    priceDataBuffer = price + '\n' + inflation;
    fs.writeFileSync(path + "\\price.txt", priceDataBuffer, function(err) {
    });
}

process.on('SIGINT', function() {
    var path = process.cwd();
    saveUserData(path);
    savePriceData(path);
    process.exit();
});
   
process.on('uncaughtException', function(err) {
    console.log(err);
    var path = process.cwd();
    saveUserData(path);
    savePriceData(path);
    process.exit();
});

function help(message) {
    var response = '';
    response += '```Commands:\n\t';
    response += '!version```';
    response += '!register\n\t';
    response += '!balance\n\t';
    response += '!history\n\t';
    response += '!price\n\t';
    response += '!fee\n\t';
    response += '!volume\n\t';
    response += '!inflation\n\t';
    response += '!leaderboard\n\t';
    response += '!advice\n\t';
    response += '!mine start\n\t';
    response += '!mine stop\n\t';
    response += '!buy <amount m¢>\n\t';
    response += '!sell <amount m¢>\n\t';
    response += '!mcflip <ribs/loins> <amount m¢>\n\t';
    response += '!dice rules\n\t';
    response += '!dice challenge <username> <amount m¢>\n\t';
    response += '!dice accept <username> <amount m¢>\n\t';
    response += '!send user <username> <amount m¢>\n\t';
    message.channel.send(response);
}

function version(message) {
    const response = '`This is MeatCoin 2.0 betch!`'
    message.channel.send(response, {
        tts: true
    });
}

function register(message) {
    var response = '<@' + id + '>';

    const id = message.member.user.id;
    const username = message.member.user.username;
    if (id in ledger) {
        var userData = ledger[id];
        userData.channel = message.channel;
        response += ', you are already registered.';
    }
    else {
        var userData = {
            username: username,
            gold: 0.0,
            meatCoin: 0.0,
            isMining: false,
            channel: message.channel
        };
        ledger[id] = userData;
        response += ', you have succesfully registered.';
    }

    message.channel.send(response);
}

function balance(message) {
    var response = '<@' + id + '>';

    // check user registration
    const id = message.member.user.id;
    if (!id in ledger) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    var userData = ledger[id];
    userData.channel = message.channel;
    const userGold = userData.gold;
    const userMeatCoin = userData.meatCoin;
    const userValue = userGold + userMeatCoin * price;
    response += '    ' + userGold.toFixed(2) + ' gold,    ' + userMeatCoin.toFixed(2);
    response += ' MeatCoin,    Unrealized Total: ' + userValue.toFixed(2) + ' gold.';
    
    message.channel.send(response);
}

function history(message) {
    var response = '<@' + id + '>';

    // check user registration
    const id = message.member.user.id;
    if (!id in ledger) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // check if history available
    if (userData.history.length == 0) {
        message.channel.send(response + ', no history available.');
        return;
    }

    var entry;
    for (var i = 0; i < userData.history.length; i++) {
        response += '\n';
        entry = userData.history[i].split(',');
        if (entry[0] == 'b')
            response += 'Bought ';
        else
            response += 'Sold ';
        response += entry[1] + ' MeatCoin @ ' + entry[2] + ' gold.';
    }

    message.channel.send(response);
}

function price(message) {
    const response = '`The price of MeatCoin is ' + price + ' gold.`';
    message.channel.send(response);
}

function fee(message) {
    const response = '`The fee for buying and selling MeatCoin is 5%.`';
    message.channel.send(response);
}

function volume(message) {
    var response = '`' + volume.bought.toFixed(2) + ' MeatCoin bought, ' + volume.sold.toFixed(2);
    response += ' MeatCoin sold, ' + volume.gambled.toFixed(2) + ' MeatCoin gambled.`';
    message.channel.send(response);
}

function inflation(message) {
    const response = '`MeatCoin is +' + inflation + ' gold.`';
    message.channel.send(response);
}

function leaderboard(message) {
    var response = '```';

    // create array of unsorted users
    var sortedLedger = [];
    if (Object.keys(ledger).length > 0) {
        Object.keys(ledger).forEach(function(key) {
            sortedLedger.push({
                user: ledger[key].username,
                gold: ledger[key].gold,
                meatCoin: ledger[key].meatCoin
            });
        });
    }

    // sort the users by unrealied gold total
    sortedLedger.sort(function (a, b) {
        aScore = a.gold + a.meatCoin * price;
        bScore = b.gold + b.meatCoin * price;
        if (aScore > bScore)
          return -1;
        if (aScore < bScore)
          return 1;
        return 0;
    });

    // return info of top 10 users
    const end = Math.min(sortedLedger.length, 10);
    var userTotal;
    for (var i = 0; i < end; i++) {
        userTotal = sortedLedger[i].gold + sortedLedger[i].meatCoin * price;
        response += (i + 1) + '. ' + sortedLedger[i].user + ' @ ' + userTotal.toFixed(2) + ' gold';
        if (i + 1 == end)
            response += '```';
        else
            response += '\n';
    }
    
    message.channel.send(response);
}

function advice(message) {
    var response = '';
    const value = price - inflation;
    if (value > 13.34)
        response += '`SELL SELL SELL AHHHHHHHHHHHH!`';
    else if (value < 6.68)
        response += '`CALL ME CRAZY BUT IT AINT NO LIE BABY BUY BUY BUY!`'
    else
        response += '`HOLD HOLD HOLD ON TO YOUR BUTTS!`'

    message.channel.send(response, {
        tts: true
    });
}

function mineStart(message) {
    var response = '<@' + id + '>';

    // check user registration
    const id = message.member.user.id;
    if (!id in ledger) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    if (userData.isMining)
        response += ', you are already mining.';
    else {
        userData.isMining = true;
        response += ', you have started mining.';
    }

    message.channel.send(response);
}

function mineStop(message) {
    var response = '<@' + id + '>';

    // check user registration
    const id = message.member.user.id;
    if (!id in ledger) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    if (!userData.isMining)
        response += ', you are already not mining.';
    else {
        userData.isMining = false;
        response += ', you have stopped mining.';
    }

    message.channel.send(response);
}

function buy(message, coinage) {
    var response = '<@' + id + '>';

    // check user registration
    const id = message.member.user.id;
    if (!id in ledger) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // check valid number
    if (!isNaN(coinage)) {
        message.channel.send(response + ', that is an invalid number.');
        return;
    }

    // check valid amount
    const amount = parseFloat(coinage);
    if (amount <= 0.0) {
        message.channel.send(response + ', that is an invalid amount.');
        return;
    }

    // check user funds
    const value = (1.0 + fee) * (amount * price);
    if (userData.gold < value) {
        message.channel.send(response + ', you have insufficient funds. ' + value + ' gold is required.');
        return;
    }

    // ledger
    userData.gold -= value;
    userData.meatCoin += amount;
    response += ', you have bought ' + amount + ' MeatCoin for ';
    response +=  value + ' gold.';

    // price
    var priceAdjust = fee * price;
    if (amount < 1.0)
        priceAdjust = fee * price * Math.pow(amount, 2);
    price += priceAdjust;

    // history
    if (userData.history.length > 9)
        userData.history.pop();
    userData.history.unshift('b' + ',' + amount.toFixed(2) + ',' + price.toFixed(2));

    // statistics
    volume.bought += amount;
    inflation += priceAdjust;

    message.channel.send(response);
}

function sell(message, coinage) {
    var response = '<@' + id + '>';

    // check user registration
    const id = message.member.user.id;
    if (!id in ledger) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // check valid number
    if (!isNaN(coinage)) {
        message.channel.send(response + ', that is an invalid number.');
        return;
    }

    // check valid amount
    const amount = parseFloat(coinage);
    if (amount <= 0.0) {
        message.channel.send(response + ', that is an invalid amount.');
        return;
    }

    // check user funds
    if (userData.meatCoin < amount) {
        message.channel.send(response + ', you do not have that much MeatCoin.');
        return;
    }

    // ledger
    userData.gold += value;
    userData.meatCoin -= amount;
    response += ' sold ' + amount + ' MeatCoin for ' + value + ' gold.';

    // price
    var priceAdjust = fee * price;
    if (amount < 1.0)
        priceAdjust = fee * price * Math.pow(amount, 2);
    price -= priceAdjust;

    // history
    if (userData.history.length > 9)
        userData.history.pop();
    userData.history.unshift('s' + ',' + amount.toFixed(2) + ',' + price.toFixed(2));

    // statistics
    volume.sold += amount;
    inflation -= priceAdjust;

    message.channel.send(response);
}

function diceRules() {
    var response = '`From highest to lowest: 21 (Mia), 66, 55, 44, 33, 22, 11, 65, 64, 63, ';
    response +=  '62, 61, 54, 53, 52, 51, 43, 42, 41, 32, 31.`';
    message.channel.send(response);
}

function mcFlip(message, side, coinage) {
    var response = '<@' + id + '>';

    // check user registration
    const id = message.member.user.id;
    if (!id in ledger) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // check valid side
    if (side != 'ribs' && side != 'loins') {
        message.channel.send(response + ', invalid MeatCoin flip guess (ribs/loins).');
        return;
    }

    // check valid number
    if (!isNaN(coinage)) {
        message.channel.send(response + ', that is an invalid number.');
        return;
    }

    // check valid amount
    const amount = parseFloat(coinage);
    if (amount <= 0.0) {
        message.channel.send(response + ', that is an invalid amount.');
        return;
    }

    // check user funds
    if (userData.meatCoin < amount) {
        message.channel.send(response + ', you do not have that much MeatCoin.');
        return;
    }

    // server side flip
    var flip;
    if (Math.random() > 0.5)
        flip = 'ribs';
    else
        flip = 'loins';

    // price adjustment
    var priceAdjust = fee * price;
    if (amount < 1.0)
        priceAdjust = fee * price * Math.pow(amount, 2);

    // result
    if (side == flip) {
        userData.meatCoin += amount;
        response += ', you have won ' + amount + ' MeatCoin!!!';
        price += priceAdjust;
    }
    else {
        userData.meatCoin -= amount;
        response += ', you have lost ' + amount + ' MeatCoin.';
        price -= priceAdjust;
    }

    message.channel.send(response);
}

function diceChallenge(message, target, coinage) {
    var response = '<@' + id + '>';

    // check user registration
    const id = message.member.user.id;
    if (!id in ledger) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // check valid number
    if (!isNaN(coinage)) {
        message.channel.send(response + ', that is an invalid number.');
        return;
    }

    // check valid amount
    const amount = parseFloat(coinage);
    if (amount <= 0.0) {
        message.channel.send(response + ', that is an invalid amount.');
        return;
    }

    // check user funds
    if (userData.meatCoin < amount) {
        message.channel.send(response + ', you do not have that much MeatCoin.');
        return;
    }

    // find target in ledger
    var foundTarget = false;
    var targetID;
    if (Object.keys(ledger).length > 0) {
        Object.keys(ledger).forEach(function(key) {
            if (ledger[key].username == target) {
                foundTarget = true;
                targetID = key;
            }
        });
    }

    // check if target found
    if (!foundTarget) {
        message.channel.send(response + ', invalid username (case-sensitive).');
        return;
    }

    betTable[id] = {
        target: target,
        bet: amount
    };

    message.channel.send(response);
}

function diceAccept(message, target, coinage) {
    var response = '<@' + id + '>';

    // check user registration
    const id = message.member.user.id;
    if (!id in ledger) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // check valid number
    if (!isNaN(coinage)) {
        message.channel.send(response + ', that is an invalid number.');
        return;
    }

    // check valid amount
    const amount = parseFloat(coinage);
    if (amount <= 0.0) {
        message.channel.send(response + ', that is an invalid amount.');
        return;
    }

    // check user funds
    if (userData.meatCoin < amount) {
        message.channel.send(response + ', you do not have that much MeatCoin.');
        return;
    }

    // find target in ledger
    // check if user was challenged by target
    var foundTarget = false;
    var wasChallenged = false;
    var sameBet = false;
    var enoughMC = false;
    var targetID;
    if (Object.keys(ledger).length > 0) {
        Object.keys(ledger).forEach(function(key) {
            if (ledger[key].username == target) {
                foundTarget = true;
                targetID = key;

                // check if user was challenged by target
                if (ledger[targetID].target == username)
                    wasChallenged = true;

                // check that bets match
                if (ledger[targetID].bet == amount)
                    sameBet = true;

                // check that target still has enough meat coin
                if (ledger[targetID].meatCoin >= amount)
                    enoughMC = true;
            }
        });
    }

    // check if target found
    if (!foundTarget) {
        message.channel.send(response + ', invalid username (case-sensitive).');
        return;
    }

    // check if user was challenged by target
    if (!wasChallenged) {
        message.channel.send(response + ', that user has not challenged you.');
        return;
    }

    // check that the bets match
    if (!sameBet) {
        message.channel.send(response + ', that was not the offered bet.');
        return;
    }

    // check that target still has enough meat coin
    if (!enoughMC) {
        message.channel.send(response + ', that user no longer has enough MeatCoin. Bet invalidated.');
        delete betTable[targetID];
        return;
    }

    var outcome = '```';

    // challenger roll
    const targetRollA = Math.floor((Math.random() * 6) + 1)
    const targetRollB = Math.floor((Math.random() * 6) + 1)
    var targetRoll;
    if (targetRollA > targetRollB)
        targetRoll = targetRollA.toString() + targetRollB.toString();
    else
        targetRoll = targetRollB.toString() + targetRollA.toString();
    if (targetRoll == '21')
        outcome += target + ' rolls a MIA!!!\n';
    else
        outcome += target + ' rolls a ' + targetRoll[0] + ' ' + targetRoll[1] + '\n';

    // accepter roll
    const userRollA = Math.floor((Math.random() * 6) + 1);
    const userRollB = Math.floor((Math.random() * 6) + 1);
    var userRoll;
    if (userRollA > userRollB)
        userRoll = userRollA.toString() + userRollB.toString();
    else
        userRoll = userRollB.toString() + userRollA.toString();
    if (userRoll == '21')
        outcome += username + ' rolls a MIA!!!\n';
    else
        outcome += username + ' rolls a ' + userRoll[0] + ' ' + userRoll[1] + '\n';

    // result
    if (diceTable[targetRoll] > diceTable[userRoll]) {
        outcome += target + ' wins ' + amount + ' MeatCoin!!!';
        ledger[targetID].meatCoin += amount;
        ledger[id].meatCoin -= amount;
    }
    else if (diceTable[targetRoll] < diceTable[userRoll]) {
        outcome += username + ' wins ' + amount + ' MeatCoin!!!';
        ledger[targetID].meatCoin -= amount;
        ledger[id].meatCoin += amount;
    }
    else
        outcome += 'Tie! Whoever posts more memes wins!';

    outcome += '```';
    delete betTable[targetID];
    message.channel.send(outcome);
}

function sendUser(message, target, coinage) {
    var response = '<@' + id + '>';

    // check user registration
    const id = message.member.user.id;
    if (!id in ledger) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // check valid number
    if (!isNaN(coinage)) {
        message.channel.send(response + ', that is an invalid number.');
        return;
    }

    // check valid amount
    const amount = parseFloat(coinage);
    if (amount <= 0.0) {
        message.channel.send(response + ', that is an invalid amount.');
        return;
    }

    // check user funds
    if (userData.meatCoin < amount) {
        message.channel.send(response + ', you do not have that much MeatCoin.');
        return;
    }

    // find target in ledger
    var foundTarget = false;
    var targetID;
    if (Object.keys(ledger).length > 0) {
        Object.keys(ledger).forEach(function(key) {
            if (ledger[key].username == target) {
                foundTarget = true;
                targetID = key;
            }
        });
    }

    // check if target found
    if (!foundTarget) {
        message.channel.send(response + ', invalid username (case-sensitive).');
        return;
    }

    userData.meatCoin -= amount;
    ledger[targetID].meatCoin += amount;
    response += ', you have sent ' + target + ' ' + amount + ' MeatCoin.';

    message.channel.send(response);
}