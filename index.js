// https://discordapp.com/api/oauth2/authorize?client_id=403850021293785088&scope=bot&permissions=1

const fs = require('fs');
const Discord = require('discord.js');
const bot = new Discord.Client();

const fee = 0.05;
var ledger = {}
var betTable = {}
var price;
var inflation;
var volume = {
    bought: 0.0,
    sold: 0.0,
    gambled: 0.0
};
init();

var isReady = true;
bot.on('message', (message) => {
    if (message.member) {
        if (message.member.user.username == "Meat Bot")
            return
    }
    else
        return

    if (isReady) {
        isReady = false;        
        if (message.content == '!help') {
            var helpMessage = '';
            helpMessage += '```Commands:\n\t';
            helpMessage += '!register\n\t';
            helpMessage += '!balance\n\t';
            helpMessage += '!history\n\t';
            helpMessage += '!price\n\t';
            helpMessage += '!fee\n\t';
            helpMessage += '!volume\n\t';
            helpMessage += '!inflation\n\t';
            helpMessage += '!leaderboard\n\t';
            helpMessage += '!advice\n\t';
            helpMessage += '!start mine\n\t';
            helpMessage += '!stop mine\n\t';
            helpMessage += '!buy <amount $mc>\n\t';
            helpMessage += '!sell <amount $mc>\n\t';
            helpMessage += '!send <amount $mc> <username>\n\t';
            helpMessage += '!gamble <amount $mc>```';
            message.channel.send(helpMessage);
        }
        else if (message.content == '!register') {
            var id = message.member.user.id;
            var response = '<@' + id + '>';
            var username = message.member.user.username;
            if (id in ledger)
                response += ', you are already registered.';
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
        else if (message.content == '!balance') {
            var id = message.member.user.id;
            var response = '<@' + id + '>';
            if (id in ledger) {
                const userData = ledger[id];
                const userGold = userData.gold;
                const userMeatCoin = userData.meatCoin;
                const userValue = userGold + userMeatCoin * price;
                response += '    ' + userGold.toFixed(2) + ' gold,    ' + userMeatCoin.toFixed(2);
                response += ' MeatCoin,    Unrealized Total: ' + userValue.toFixed(2) + ' gold.';
            }
            else
                response += ', you are not registered.';
            message.channel.send(response);
        }
        else if (message.content == '!history') {
            var id = message.member.user.id;
            var response = '<@' + id + '>';
            if (id in ledger) {
                var userData = ledger[id];
                if (userData.channel == null)
                    userData.channel = message.channel;
                if (userData.history.length > 0) {
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
                }
                else
                    response += ', no history available.';
            }
            else
                response += ', you are not registered.';
            message.channel.send(response);
        }
        else if (message.content == '!price')
            message.channel.send('`The price of MeatCoin is ' + price + ' gold.`');
        else if (message.content == '!fee')
            message.channel.send('`The fee for buying and selling MeatCoin is 5%.`');
        else if (message.content == '!volume') {
            var volumeResponse = '';
            volumeResponse += '`' + volume.bought.toFixed(2) + ' MeatCoin bought, ' + volume.sold.toFixed(2) + ' MeatCoin sold, ';
            volumeResponse += volume.gambled.toFixed(2) + ' MeatCoin gambled.`';
            message.channel.send(volumeResponse);
        }
        else if (message.content == '!inflation')
            message.channel.send('`MeatCoin is +' + inflation + ' gold.`');
        else if (message.content == '!leaderboard') {
            var sortedLedger = [];
            if (Object.keys(ledger).length > 0) {
                Object.keys(ledger).forEach(function(key) {
                    sortedLedger.push({user: ledger[key].username, gold: ledger[key].gold, meatCoin: ledger[key].meatCoin});
                });
            }

            sortedLedger.sort(function (a, b) {
                aScore = a.gold + a.meatCoin * price;
                bScore = b.gold + b.meatCoin * price;
                if (aScore > bScore)
                  return -1;
                if (aScore < bScore)
                  return 1;
                return 0;
            });

            var leaderBoardMessage = '```';
            var userTotal;
            const end = Math.min(sortedLedger.length, 10);
            for (var i = 0; i < end; i++) {
                userTotal = sortedLedger[i].gold + sortedLedger[i].meatCoin * price;
                leaderBoardMessage += (i + 1) + '. ' + sortedLedger[i].user + ' @ ' + userTotal.toFixed(2) + ' gold';
                if (i + 1 == end)
                    leaderBoardMessage += '```';
                else
                    leaderBoardMessage += '\n';
            }
            message.channel.send(leaderBoardMessage);
        }
        else if (message.content == '!advice') {
            var value = price - inflation;
            if (value > 13.34) {
                message.channel.send('`SELL SELL SELL AHHHHHHHHHHHH!`', {
                    tts: true
                });
            }
            else if (value < 6.68) {
                message.channel.send('`CALL ME CRAZY BUT IT AINT NO LIE BABY BUY BUY BUY!`', {
                    tts: true
                });
            }
            else {
                message.channel.send('`HOLD HOLD HOLD ON TO YOUR BUTTS!`', {
                    tts: true
                });
            }
        }
        else if (message.content == '!start mine') {
            var id = message.member.user.id;
            var response = '<@' + id + '>';
            if (id in ledger) {
                var userData = ledger[id];
                if (userData.channel == null)
                    userData.channel = message.channel;
                if (userData.isMining)
                    response += ', you are already mining.';
                else {
                    userData.isMining = true;
                    response += ', you have started mining.';
                }
            }
            else
                response += ', you are not registered.';
            message.channel.send(response);
        }
        else if (message.content == '!stop mine') {
            var id = message.member.user.id;
            var response = '<@' + id + '>';
            if (id in ledger) {
                var userData = ledger[id];
                if (userData.channel == null)
                    userData.channel = message.channel;
                if (!userData.isMining)
                    response += ', you are already not mining.';
                else {
                    userData.isMining = false;
                    response += ', you have stopped mining.';
                }
            }
            else
                response += ', you are not registered.';
            message.channel.send(response);
        }
        else {
            const splitMessage = message.content.split(' ');
            if (splitMessage.length == 1) {
                var id = message.member.user.id;
                if (Object.keys(betTable).length > 0) {
                    Object.keys(betTable).forEach(function(key) {
                        if (key == id) {
                            var response = '<@' + id + '>';
                            const userGuess = splitMessage[0];
                            if (!isNaN(userGuess)) {
                                const amount = parseFloat(userGuess);
                                if (amount >= 1.0 && amount <= betTable[key].range) {
                                    if (userGuess == betTable[key].magic) {
                                        const prize = betTable[key].range * betTable[key].amount;
                                        response += ', you have won ' + prize + ' MeatCoin!!!';
                                    }
                                    else {
                                        response += ', you have lost ' + betTable[key].amount + ' MeatCoin :(';
                                        response += '    Correct answer: ' + betTable[key].magic;
                                    }
                                    delete betTable[id];
                                }
                                else
                                    response += ', invalid guess';
                            }
                            else
                                response += ', invalid guess';
                            message.channel.send(response);
                        }
                    });
                }
            }
            else if (splitMessage.length == 2) {
                if (splitMessage[0] == '!buy' || splitMessage[0] == '!sell' || splitMessage[0] == '!gamble') {
                    var id = message.member.user.id;
                    var response = '<@' + id + '>';
                    if (id in ledger) {
                        if (!isNaN(splitMessage[1])) {
                            const amount = parseFloat(splitMessage[1]);
                            if (amount > 0.0) {
                                var userData = ledger[id];
                                if (splitMessage[0] == '!buy') {
                                    const value = (1.0 + fee) * (amount * price);
                                    if (userData.gold >= value) {
                                        // ledger
                                        userData.gold -= value;
                                        userData.meatCoin += amount;
                                        response += ', you have bought ' + amount + ' MeatCoin for ';
                                        response +=  value + ' gold.';
                                        // price
                                        var priceAdjust = fee * price;;
                                        if (amount < 1.0)
                                            priceAdjust = fee * price * Math.pow(amount, 2);
                                        price += priceAdjust;
                                        // history
                                        if (userData.history.length > 9)
                                            userData.history.pop();
                                        userData.history.unshift('b' + ',' + amount.toFixed(2) + ',' + price.toFixed(2));
                                        // volume
                                        volume.bought += amount;
                                        // inflation
                                        inflation += priceAdjust;
                                    }
                                    else {
                                        response += ', you have insufficient funds. ' + value;
                                        response += ' gold is required.';
                                    }
                                }
                                else if (splitMessage[0] == '!sell') {
                                    const value = (1.0 - fee) * (amount * price);
                                    if (userData.meatCoin >= amount) {
                                        // ledger
                                        userData.gold += value;
                                        userData.meatCoin -= amount;
                                        response += ' sold ' + amount + ' MeatCoin for ' + value + ' gold.';
                                        // price
                                        var priceAdjust = fee * price;
                                        if (amount < 1.0)
                                            price -= fee * price * Math.pow(amount, 2);
                                        // history
                                        if (userData.history.length > 9)
                                            userData.history.pop();
                                        userData.history.unshift('s' + ',' + amount.toFixed(2) + ',' + price.toFixed(2));
                                        // volume
                                        volume.sold += amount;
                                        // inflation
                                        inflation -= priceAdjust;
                                    }
                                    else
                                        response += ', you do not have that much MeatCoin.';
                                }
                                else {
                                    if (userData.meatCoin >= amount) {
                                        const range = Math.floor((Math.random() * 6) + 1);
                                        response += ', I\'m thinking of a number between 1 and ' + range;
                                        userData.meatCoin -= amount;
                                        const bet = {
                                            range: range,
                                            magic: Math.floor((Math.random() * range) + 1),
                                            amount: amount
                                        }
                                        betTable[id] = bet;
                                        volume.gambled += amount;
                                    }
                                    else
                                        response += ', you do not have that much MeatCoin.';
                                }
                            }
                            else
                                response += ', that is an invalid amount.';
                        }
                        else
                            response += ', that is an invalid amount.';
                    }
                    else
                        response += ', you are not registered.';
                    message.channel.send(response);
                }
            }
            else if (splitMessage.length > 2) {
                if (splitMessage[0] == '!send') {
                    var id = message.member.user.id;
                    if (id in ledger) {
                        var response = '<@' + id + '>';
                        if (!isNaN(splitMessage[1])) {
                            const amount = parseFloat(splitMessage[1]);
                            if (amount > 0.0) {
                                var receiver = '';
                                for (var i = 2; i < splitMessage.length; i++) {
                                    receiver += splitMessage[i];
                                    if (i != splitMessage.length - 1)
                                        receiver += ' ';
                                }

                                // find receiver in ledger
                                var found = false;
                                var receiverID;
                                if (Object.keys(ledger).length > 0) {
                                    Object.keys(ledger).forEach(function(key) {
                                        if (ledger[key].username == receiver) {
                                            found = true;
                                            receiverID = key;
                                        }
                                    });
                                }

                                if (found == true) {
                                    var userData = ledger[id];
                                    if (userData.meatCoin >= amount) {
                                        userData.meatCoin -= amount;
                                        ledger[receiverID].meatCoin += amount;
                                        response += ', you have sent ' + receiver + ' ' + amount + ' MeatCoin.';
                                    }
                                    else
                                        response += ', you do not have that much MeatCoin.';
                                }
                                else
                                    response += ', invalid username (case-sensitive).';
                            }
                            else
                                response += ', that is an invalid amount.';
                        }
                        else
                            response += ', that is an invalid amount.';
                    }
                    else
                        response += ', you are not registered.';
                    message.channel.send(response);
                }
            }
        }
        isReady = true;
    }
});

bot.login('NDAzODUwMDIxMjkzNzg1MDg4.DUNWXg.gZO0tw4YCHk9SjamhoYgJn89quY');
setInterval(mine, 60000);
setInterval(mediumFluctuate, 37000);
setInterval(smallFluctuate, 17000);

function init() {
    parseLedger();
    parsePrice();
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

function mine() {
    if (isReady) {
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