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
var volume = {
    bought: 0.0,
    sold: 0.0,
    gambled: 0.0
};
var miners = 0;
var registered = 0;

// setup
init();
var isReady = true;

// handle user commands
bot.on('message', (message) => {
    // idk why this is necessary
    if (!message.member.user)
        return;

    // ignore messages from Meat Coin
    if (message.member.user.username == "Meat Coin")
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
            printPrice(message);
        else if (command == '!fee')
            printFee(message);
        else if (command == '!volume')
            printVolume(message);
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
        else if (command == '!flip' && directive == 'rules')
            flipRules(message);
    }
    else if (splitMessage.length == 3) {
        const command = splitMessage[0];
        const directive = splitMessage[1];
        const coinage = splitMessage[2];

        if (command == '!flip')
            flip(message, directive, coinage);
        else if (message == '!hall of fame')
            hallOfFame(message);
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
        else if (command == '!send' && directive == 'user')
            sendUser(message, username, coinage);
    }
    isReady = true;
});

function init() {
    const secret = parseSecret();
    parseLedger();
    parsePrice();
    populateDiceTable();
    setInterval(mine, 60000);
    setInterval(fluctuate, 5000);

    // Meat Coin login
    bot.login(secret);
}

function parseSecret() {
    const path = process.cwd();
    const buffer = fs.readFileSync(path + "\\secret.txt").toString().split('\n');

    price = parseFloat(buffer[0].toString());
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
        registered += 1;
    }
}

function parsePrice() {
    const path = process.cwd();
    const buffer = fs.readFileSync(path + "\\price.txt").toString().split('\n');

    price = parseFloat(buffer[0].toString());
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
    const magicNumber = Math.floor((Math.random() * Math.max(miners, 10)) + 1);
    var userData;
    var userGuess;
    Object.keys(ledger).forEach(function(key) {
        userData = ledger[key];
        if (userData.isMining == true) {
            userGuess = Math.floor((Math.random() * Math.max(miners, 10)) + 1);
            if (userGuess == magicNumber) {
                // make a standard gaussian variable.     
                var standard = gaussian(price/2, price/2);
                const reward = Math.ceil(standard());

                var response = '<@' + key + '>' + ', you have mined ' + reward + ' gold!!!';
                userData.gold += reward;
                userData.channel.send(response);
            }
        }
    });
    isReady = true;
}

function fluctuate() {
    const priceSave = price;
    const priceAdjust = 1 + Math.random()/75.0;
    if (Math.random() > 0.5)
        price /= priceAdjust;
    else
        price *= priceAdjust;
    console.log('fluctuate: ' + (price - priceSave));
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
    priceDataBuffer = price + '\n';
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
    response += '```css\n';
    response += '[MeatCoin v2.4]';
    response += '\n\t#info';
    response += '\n\t\t!balance';
    response += '\n\t\t!history';
    response += '\n\t\t!price';
    response += '\n\t\t!fee';
    response += '\n\t\t!volume';
    response += '\n\t\t!leaderboard';
    response += '\n\t\t!advice';
    response += '\n\n\t#weigners';
    response += '\n\t\t!prize';
    response += '\n\t\t!victory';
    response += '\n\n\t#brokerage';
    response += '\n\t\t!register';
    response += '\n\t\t!mine start';
    response += '\n\t\t!mine stop';
    response += '\n\t\t!buy <amount m¢/max>';
    response += '\n\t\t!sell <amount m¢/max>';
    response += '\n\n\t#gamble';
    response += '\n\t\t!flip rules';
    response += '\n\t\t!flip <ribs/loins> <amount m¢>';
    response += '\n\t\t!dice rules';
    response += '\n\t\t!dice challenge <username> <amount m¢>';
    response += '\n\t\t!dice accept <username> <amount m¢>';
    response += '\n\n\t#coerce';
    response += '\n\t\t!send user <username> <amount m¢>';
    response += '\n\n\t#legends';
    response += '\n\t\t!hall of fame';
    response += '```';
    message.channel.send(response);
}

function balance(message) {
    const id = message.member.user.id;
    var response = '<@' + id + '>';

    // check user registration
    if (!(id in ledger)) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    response = '```glsl\n';
    var userData = ledger[id];
    userData.channel = message.channel;
    const userGold = userData.gold;
    const userMeatCoin = userData.meatCoin;
    const userValue = userGold + userMeatCoin * price;
    response += userData.username + '\n';
    response += '\t' + userGold.toFixed(2) + ' gold\n';
    response += '\t' + userMeatCoin.toFixed(2) + ' MeatCoin\n';
    response += '\t' + userValue.toFixed(2) + ' unrealized';
    response += '```';
    
    message.channel.send(response);
}

function history(message) {
    const id = message.member.user.id;
    var response = '<@' + id + '>';

    // check user registration
    if (!(id in ledger)) {
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

    response = '```glsl\n';
    response += userData.username;
    var entry;
    for (var i = 0; i < userData.history.length; i++) {
        response += '\n';
        entry = userData.history[i].split(',');
        if (entry[0] == 'b')
            response += '\tBought ';
        else
            response += '\tSold ';
        response += entry[1] + ' MeatCoin @ ' + entry[2] + ' gold.';
    }
    response += '```';

    message.channel.send(response);
}

function printPrice(message) {
    const response = '```glsl\nThe price of MeatCoin is ' + price + ' gold.```';
    message.channel.send(response);
}

function printFee(message) {
    const response = '```glsl\nThe fee to buy/sell MeatCoin is 5 %.```';
    message.channel.send(response);
}

function printVolume(message) {
    var response = '```glsl\nTrading Session\n'
    response += '\t' + volume.bought.toFixed(2) + ' MeatCoin bought.\n';
    response += '\t' + volume.sold.toFixed(2) + ' MeatCoin sold.\n';
    response += '\t' + volume.gambled.toFixed(2) + ' MeatCoin gambled.```';
    message.channel.send(response);
}

function leaderboard(message) {
    var response = '```glsl\n';

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

    // sort the users by realied gold total
    sortedLedger.sort(function (a, b) {
        aScore = a.gold + a.meatCoin * price;
        bScore = b.gold + b.meatCoin * price;
        if (aScore > bScore)
          return -1;
        if (aScore < bScore)
          return 1;
        return 0;
    });

    // return info of all users
    var userGold;
    var userMeatCoin;
    for (var i = 0; i < sortedLedger.length; i++) {
        userGold = sortedLedger[i].gold.toFixed(2);
        userMeatCoin = sortedLedger[i].meatCoin.toFixed(2);
        response += (i + 1) + '. ' + sortedLedger[i].user + ' - ' + userGold + ' gold + ' + userMeatCoin + ' $mc';
        if (i + 1 == sortedLedger.length)
            response += '```';
        else
            response += '\n';
    }
    
    message.channel.send(response);
}

function advice(message) {
    var response = '```';
    const value = price;
    if (Math.random() > 0.5)
        response += 'SELL SELL SELL AHHHHHHHHHHHH!';
    else
        response += 'CALL ME CRAZY BUT IT AINT NO LIE BABY BUY BUY BUY!'

    message.channel.send(response, {
        tts: true
    });
}

function register(message) {
    const id = message.member.user.id;
    var response = '<@' + id + '>';

    // check if user already registered
    const username = message.member.user.username;
    if (id in ledger) {
        var userData = ledger[id];
        userData.channel = message.channel;
        response += ', you are already registered.';
    }
    else {
        // register
        var userData = {
            username: username,
            gold: 1.0,
            meatCoin: 0.0,
            isMining: false,
            channel: message.channel,
            history: []
        };
        ledger[id] = userData;
        response = '```glsl\n' + username;
        response += ' has succesfully registered.```';
        registered += 1;
    }

    message.channel.send(response);
}

function victory(message) {
    const id = message.member.user.id;
    var response = '<@' + id + '>';

    // check user registration
    if (!(id in ledger)) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    const username = message.member.user.username;
    if (userData.gold > 1000000000) {
        console.log("victory: " + username);
        response = '```glsl\n' + username;
        response += ' has won MeatCoin. Contact @jamespar for your prize you meaty bitch!```';
        message.channel.send(response);
        var path = process.cwd();
        saveUserData(path);
        savePriceData(path);
        process.exit();
    }
    else {
        response = '```glsl\n';
        response += 'Victory requires 1,000,000 gold. Keep beating that meat!```';
    }

    message.channel.send(response);
}

function prize(message) {
    const id = message.member.user.id;

    // update user channel
    if (id in ledger) {
        var userData = ledger[id];
        userData.channel = message.channel;
    }

    response = '```glsl\n';
    //response += 'The prize for winning MeatCoin is a Steam game of your choice (up to $10 value).```';
    response += 'No prize at this time lol```';

    message.channel.send(response);
}

function mineStart(message) {
    const id = message.member.user.id;
    var response = '<@' + id + '>';

    // check user registration
    if (!(id in ledger)) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // start mining
    if (userData.isMining)
        response += ', you are already mining.';
    else {
        userData.isMining = true;
        response = '```glsl\n' + userData.username;
        response += ' has started mining.';
        response += '```';
        miners += 1;
    }

    message.channel.send(response);
}

function mineStop(message) {
    const id = message.member.user.id;
    var response = '<@' + id + '>';

    // check user registration
    if (!(id in ledger)) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // stop mining
    if (!userData.isMining)
        response += ', you are already not mining.';
    else {
        userData.isMining = false;
        response = '```glsl\n' + userData.username;
        response += ' has stopped mining.';
        response += '```';
    }

    message.channel.send(response);
}

function buy(message, coinage) {
    const id = message.member.user.id;
    var response = '<@' + id + '>';

    // check user registration
    if (!(id in ledger)) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // check valid number
    if (isNaN(coinage) && coinage != 'max') {
        message.channel.send(response + ', that is an invalid number.');
        return;
    }

    // check for max
    var amount;
    if (coinage == 'max')
        amount  = (userData.gold / price) * (1 - fee);
    else
        amount = parseFloat(coinage);

    // check valid amount
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
    response = '```glsl\n' + userData.username;
    response += ' bought ' + amount + ' MeatCoin for ';
    response +=  value.toFixed(2) + ' gold @ ' + price.toFixed(2) + ' gold.';
    response += '```';

    // history
    if (userData.history.length > 9)
        userData.history.pop();
    userData.history.unshift('b' + ',' + amount.toFixed(2) + ',' + price.toFixed(2));

    // statistics
    volume.bought += amount;

    message.channel.send(response);
}

function sell(message, coinage) {
    const id = message.member.user.id;
    var response = '<@' + id + '>';

    // check user registration
    if (!(id in ledger)) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // check valid number
    if (isNaN(coinage) && coinage != 'max') {
        message.channel.send(response + ', that is an invalid number.');
        return;
    }

    // check for max
    var amount;
    if (coinage == 'max')
        amount = userData.meatCoin;
    else
        amount = parseFloat(coinage);

    // check valid amount
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
    const value = (1.0 - fee) * (amount * price);
    userData.gold += value;
    userData.meatCoin -= amount;
    response = '```glsl\n' + userData.username;
    response += ' sold ' + amount + ' MeatCoin for ' + value.toFixed(2) + ' gold ';
    response += '@ ' + price.toFixed(2) + ' gold.'
    response += '```';

    // history
    if (userData.history.length > 9)
        userData.history.pop();
    userData.history.unshift('s' + ',' + amount.toFixed(2) + ',' + price.toFixed(2));


    // statistics
    volume.sold += amount;

    message.channel.send(response);
}

function diceRules(message) {
    var response = '```glsl\nEach player rols two dice. The player with the higher value wins.\n';
    response += 'From highest to lowest: \n\t21, 66, 55, 44, 33, 22, 11';
    response +=  '\n\t65, 64, 63, 62, 61, 54, 53';
    response += '\n\t52, 51, 43, 42, 41, 32, 31```';
    message.channel.send(response);
}

function flipRules(message) {
    var response = '```Call ribs/loins. Flip the MeatCoin. Meat your maker!```';
    message.channel.send(response);
}

function flip(message, side, coinage) {
    const id = message.member.user.id;
    var response = '<@' + id + '>';

    // check user registration
    if (!(id in ledger)) {
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
    if (isNaN(coinage)) {
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


    // result
    response = '```glsl\n' + userData.username;
    if (side == flip) {
        userData.meatCoin += amount;
        response += ' has won ' + amount + ' MeatCoin!!!';
    }
    else {
        userData.meatCoin -= amount;
        response += ' has lost ' + amount + ' MeatCoin. LOL!';
    }
    response += '```';

    volume.gambled += amount;
    message.channel.send(response);
}

function hallOfFame(message) {
    var response = '```glsl\n';
    response += 'Winner of MeatCoin 2.2: The old razzmataz';
    response += '```';
    message.channel.send(response);
}

function diceChallenge(message, target, coinage) {
    const id = message.member.user.id;
    var response = '<@' + id + '>';

    // check user registration
    if (!(id in ledger)) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // check valid number
    if (isNaN(coinage)) {
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

    // check for self challenge
    if (userData.username == target) {
        message.channel.send(response + ', you can not challenge yourself.');
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

    response = '<@' + targetID + '>';
    response += ', ' + userData.username + ' challenged you to dice @ ' + amount + ' MeatCoin.';

    message.channel.send(response);
}

function diceAccept(message, target, coinage) {
    const id = message.member.user.id;
    var response = '<@' + id + '>';

    // check user registration
    if (!(id in ledger)) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // check valid number
    if (isNaN(coinage)) {
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
                if (betTable[targetID] != null) {
                    if (betTable[targetID].target == userData.username)
                        wasChallenged = true;

                    // check that bets match
                    if (betTable[targetID].bet == amount)
                        sameBet = true;

                    // check that target still has enough meat coin
                    if (ledger[targetID].meatCoin >= amount)
                        enoughMC = true;
                }
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

    var targetOutcome = '```glsl\n';
    // challenger roll
    const targetRollA = Math.floor((Math.random() * 6) + 1)
    const targetRollB = Math.floor((Math.random() * 6) + 1)
    var targetRoll;
    if (targetRollA > targetRollB)
        targetRoll = targetRollA.toString() + targetRollB.toString();
    else
        targetRoll = targetRollB.toString() + targetRollA.toString();
    if (targetRoll == '21')
        targetOutcome += target + ' rolls a MIA!!!\n';
    else
        targetOutcome += target + ' rolls a ' + targetRoll[0] + ' ' + targetRoll[1] + '\n';
    targetOutcome += '```';
    message.channel.send(targetOutcome);

    // add suspense for second dice roll
    var userRoll;
    setTimeout(function() {
        var userOutcome = '```glsl\n';
        // accepter roll
        const userRollA = Math.floor((Math.random() * 6) + 1);
        const userRollB = Math.floor((Math.random() * 6) + 1);
        if (userRollA > userRollB)
            userRoll = userRollA.toString() + userRollB.toString();
        else
            userRoll = userRollB.toString() + userRollA.toString();
        if (userRoll == '21')
            userOutcome += userData.username + ' rolls a MIA!!!\n';
        else
            userOutcome += userData.username + ' rolls a ' + userRoll[0] + ' ' + userRoll[1] + '\n';
        userOutcome += '```';
        message.channel.send(userOutcome);
    }, 3000);

    // add suspense for result
    setTimeout(function() {
        outcome = '```glsl\n';
        // result
        if (diceTable[targetRoll] > diceTable[userRoll]) {
            outcome += target + ' wins ' + amount + ' MeatCoin!!!';
            ledger[targetID].meatCoin += amount;
            ledger[id].meatCoin -= amount;
        }
        else if (diceTable[targetRoll] < diceTable[userRoll]) {
            outcome += userData.username + ' wins ' + amount + ' MeatCoin!!!';
            ledger[targetID].meatCoin -= amount;
            ledger[id].meatCoin += amount;
        }
        else
            outcome += 'Tie! Whoever posts the best meme wins!';
        outcome += '```';
        message.channel.send(outcome);
    }, 6000);

    delete betTable[targetID];
    volume.gambled += amount;
}

function sendUser(message, target, coinage) {
    const id = message.member.user.id;
    var response = '<@' + id + '>';

    // check user registration
    if (!(id in ledger)) {
        message.channel.send(response + ', you are not registered.');
        return;
    }

    // update user channel
    var userData = ledger[id];
    userData.channel = message.channel;

    // check valid number
    if (isNaN(coinage)) {
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

    // check for self send
    if (userData.username == target) {
        message.channel.send(response + ', you can not send to your self.');
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

    response = '<@' + targetID + '>';
    userData.meatCoin -= amount;
    ledger[targetID].meatCoin += amount;
    response += ', ' + userData.username + ' has sent you ' + amount + ' MeatCoin.';

    message.channel.send(response);
}

function gaussian(mean, stdev) {
    var y2;
    var use_last = false;
    return function() {
        var y1;
        if(use_last) {
           y1 = y2;
           use_last = false;
        }
        else {
            var x1, x2, w;
            do {
                 x1 = 2.0 * Math.random() - 1.0;
                 x2 = 2.0 * Math.random() - 1.0;
                 w  = x1 * x1 + x2 * x2;               
            } while( w >= 1.0);
            w = Math.sqrt((-2.0 * Math.log(w))/w);
            y1 = x1 * w;
            y2 = x2 * w;
            use_last = true;
       }

       var retval = mean + stdev * y1;
       if(retval > 0) 
           return retval;
       return -retval;
   }
}

// ::todo::
// debt
// dividends
// double check buy/sell math
// add send and gambling to history
// make fluctuations non random? leaderboards by real gold only. need incentive
// order leaderboard by real gold
// price history
// lottery
// loans - interest - have to pay back by end of session or lose it all
// hall of fame: billy won v2.2
// add debt feature (shorting) loan?
// mine if registered
// buy chance cards

// ::notes::
// the more the price grows, the more it fluctuates
// but the rate of increase remains the same

// ::ideas::
// competing economies - who can make the most wealth?
// cookie crpyto? app
// cookie coin
// cookie crypto could be meat coin type simulation
// or track real market trends (prob not)