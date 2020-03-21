const fs = require('fs');
const Discord = require('discord.js');
const bot = new Discord.Client();

// constants
const fee = 0.05;
const postFee = 0.07;

// user data
var ledger = {};
var market = [];
var betTable = {};
var diceTable = {};

// statistics
var price;
var time;
var meatTotalLast = 0;
var volume = {
    bought: 0.0,
    sold: 0.0,
    gambled: 0.0,
    traded: 0.0
};
var miners = 0;
var registered = 0;
var marketSize = 0;

// setup
init();
var isReady = true;

// handle user commands
bot.on('message', (message) => {
    // idk why this is necessary
    if (!message.member)
        return;
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
        else if (command == '!market')
            printMarket(message);
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
        else if (command == '!market' && directive == 'rules')
            marketRules(message);
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
        if(splitMessage.length == 4 && command == '!post'){
            const directive = splitMessage[1];
            const coinage = splitMessage[2];
            const price = splitMessage[3]
            post(message, directive, price, coinage)
        }
        else{
            const directive = splitMessage[1];
            const username = splitMessage.slice(2, splitMessage.length - 1).join(' ');
            const price = splitMessage[2]
            const coinage = splitMessage[splitMessage.length - 1];
    
            if (command == '!dice' && directive == 'challenge')
                diceChallenge(message, username, coinage);
            else if (command == '!dice' && directive == 'accept')
                diceAccept(message, username, coinage);
            else if (command == '!send' && directive == 'user')
                sendUser(message, username, coinage);
            }
    }
    isReady = true;
});

function init() {
    const token = parseToken();
    parseLedger();
    parseSupply();
    parsePrice();
    parseTime();
    meatState();
    populateDiceTable();
    setInterval(timeIncrement, 1000);
    setInterval(mine, 60000);
    setInterval(fluctuate, 5000);

    // Meat Coin login
    bot.login(token);
}

function parseToken() {
    const path = process.cwd();
    const buffer = fs.readFileSync(path + "\\data\\token.txt").toString().split('\n');
    return buffer[0]
}

function parseSupply(message) {
    var path = process.cwd()
    var buffer = fs.readFileSync(path + "\\data\\meatMarket.txt");
    var lines = buffer.toString().split("\n");
    var buyerData = {};
    var sellerData = {};
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].replace('\r', '');
        
        if (line.length > 0) {
            var data = line.split('\t');
            if(data[2]=='B'){
                buyerData[data[0]]={
                username: data[1],
                price: parseFloat(data[3]),
                quantity: parseFloat(data[4])
                };
            }
            else if(data[2]=='S'){
                sellerData[data[0]]={
                username: data[1],
                price: parseFloat(data[3]),
                quantity: parseFloat(data[4])
                };
            }          
        }
        marketSize += 1;
    }
    market[0]=buyerData;
    market[1]=sellerData;

}

function printMarket(message) {
var response = '```glsl\nGET YER FLESH HERE!\n';
if (Object.keys(market[1]).length > 0) {
    response += 'SELLERS'.padEnd(18,'-') + '+' + 'QUANTITY'.padStart(20,'-') + '+' + 'PRICE'.padStart(14,'-') + '+\n';
    Object.keys(market[1]).forEach(function(key) { 
        response += market[1][key].username.padEnd(18,' ') + '|' + String(market[1][key].quantity).padStart(20,' ') + '|' + String(market[1][key].price).padStart(14,' ') + '|\n';
    });
}
if (Object.keys(market[0]).length > 0) {
    response += 'BUYERS'.padEnd(18,'-') + '+' + 'QUANTITY'.padStart(20,'-') + '+' + 'PRICE'.padStart(14,'-') + '+\n';
    Object.keys(market[0]).forEach(function(key) {
        response += market[0][key].username.padEnd(18,' ') + '|' + String(market[0][key].quantity).padStart(20,' ') + '|' + String(market[0][key].price).padStart(14,' ') + '|\n';
    });
}
response += '```';
message.channel.send(response);
}

function marketRules(message){ 
    var response = '```!post buy/sell and set quantity then price, buyers lose out on price differential so be careful!\nNo fee for posting/matching, but 7% per adjustment incl. cancellations.```';
    message.channel.send(response);
}

function saveMarketData(path) {
    var postingDataBuffer = '';
    var postingData;
    for (var i = market.length - 1; i >= 0; i--) {
        if (Object.keys(market[i]).length > 0) {
            Object.keys(market[i]).forEach(function(key) {
                postingData = market[i][key];
                postingDataBuffer += key;
                postingDataBuffer += '\t';
                postingDataBuffer += postingData.username;
                postingDataBuffer += '\t';
                postingDataBuffer += (i ? 'S' : 'B');
                postingDataBuffer += '\t';
                postingDataBuffer += parseFloat(postingData.price).toFixed(4);
                postingDataBuffer += '\t';
                postingDataBuffer += parseFloat(postingData.quantity).toFixed(4);
                postingDataBuffer += '\n';
            });

            postingDataBuffer = postingDataBuffer.substring(0, postingDataBuffer.length);
            fs.writeFileSync(path + "\\data\\meatMarket.txt", postingDataBuffer, function(err) {
            });
        }
    }
}

function parseLedger() {
    var path = process.cwd();
    var buffer = fs.readFileSync(path + "\\data\\ledger.txt");
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
    const buffer = fs.readFileSync(path + "\\data\\price.txt").toString().split('\n');

    price = parseFloat(buffer[0].toString());
}

function parseTime() {
    const path = process.cwd();
    const buffer = fs.readFileSync(path + "\\data\\time.txt").toString().split('\n');

    time = parseFloat(buffer[0].toString());
}

function meatState() {
  if (Object.keys(ledger).length > 0) {
      Object.keys(ledger).forEach(function(key) {
          userData = ledger[key];
          meatTotalLast += parseFloat(userData.meatCoin.toFixed(2));
        });
  }
  console.log('Last meat total: ' + meatTotalLast);
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
    var goldTotal = 0;
    var meatTotal = 0;
    var userData;
    if (Object.keys(ledger).length > 0)
        Object.keys(ledger).forEach(function(key) {
            userData = ledger[key];
            goldTotal += parseFloat(userData.gold.toFixed(2));
            meatTotal += parseFloat(userData.meatCoin.toFixed(2));
          });
    //Adjust by random fluctuations, trending down for deflation:
    const priceAdjust = 1 + Math.random()/75.0;
    var adjuster = Math.random();
    var hyperAdjuster;
    if (adjuster < 0.55)
        price /= priceAdjust;
    //Rare chance of large "hyper" fluctuation
    else if (adjuster > .995) {
        hyperAdjuster = 1 + Math.random()/2;
        console.log("HYPER! " + hyperAdjuster);
        if (Math.random() > 0.5) {
            price /= hyperAdjuster;
        } else {
            price *= hyperAdjuster;
        }
    } else {
        price *= priceAdjust;
    }
    //Adjust for total market, scaled down by 5:
    if (meatTotal > 0) {
      price = price*((2*meatTotal+meatTotal)/(2*meatTotal+meatTotalLast));
    }
    meatTotalLast = meatTotal;
    console.log('fluctuate: ' + (price - priceSave));
    console.log('Gold in Market: ' + goldTotal);
    console.log('Meat in Market: ' + meatTotal);
    console.log('Total Time Market Open: ' + time);
}

function timeIncrement(){
    time += 1;
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
        fs.writeFileSync(path + "\\data\\ledger.txt", userDataBuffer, function(err) {
        });
    }
}

function savePriceData(path) {
    var priceDataBuffer = '';
    priceDataBuffer = price + '\n';
    fs.writeFileSync(path + "\\data\\price.txt", priceDataBuffer, function(err) {
    });
}

function saveTimeData(path) {
    var timeDataBuffer = '';
    timeDataBuffer = time + '\n';
    fs.writeFileSync(path + "\\data\\originTime.txt", timeDataBuffer, function(err) {
    });
}

process.on('SIGINT', function() {
    var path = process.cwd();
    saveUserData(path);
    savePriceData(path);
    saveTimeData(path);
    saveMarketData(path);
    process.exit();
});

process.on('uncaughtException', function(err) {
    console.log(err);
    var path = process.cwd();
    saveUserData(path);
    savePriceData(path);
    saveMarketData(path);
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
    response += '\n\t\t!post <buy/sell/adjust> <amount m¢> <price>'
    response += '\n\t\t!market'
    response += '\n\t\t!market rules'
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
    const response = '```glsl\nThe fee to buy/sell MeatCoin is 5 %.\nThere is NO FEE for posting on the meatMarket, but you will lose 7% for adjustments! (incl. cancellations)```';
    message.channel.send(response);
}

function printVolume(message) {
    var response = '```glsl\nTrading Session\n'
    response += '\t' + volume.bought.toFixed(2) + ' MeatCoin bought.\n';
    response += '\t' + volume.sold.toFixed(2) + ' MeatCoin sold.\n';
    response += '\t' + volume.gambled.toFixed(2) + ' MeatCoin gambled.\n';
    response += '\t' + volume.traded.toFixed(2) + ' MeatCoin traded.```';
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

function post(message, command, price, coinage){

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
    if (isNaN(coinage) || isNaN(price)) {
        message.channel.send(response + ', that is an invalid number.');
        return;
    }

    amount = parseFloat(coinage);
    floatPrice = parseFloat(price);

    if (command == 'buy'){
        // check valid amount
        if (amount <= 0.0) {
            message.channel.send(response + ', that is an invalid amount.');
            return;
        }
        // check user funds
        const value = (amount * floatPrice);
        if (userData.gold < value) {
            message.channel.send(response + ', you have insufficient funds. ' + value + ' gold is required.');
            return;
        }
        //check that the user is not already buying
        if (id in market[0]){
            response += ', you can\'t create a buy posting, you are already buying. Use !post adjust.\n';
            message.channel.send(response);
            message.author.send('Your posting:\n' + id.padStart(18,'0') + '\tB ' + String(market[0][id].quantity).padStart(10,' ') + '\t@' + String(market[0][id].price).padStart(8,' ') + '\n');
            return;
        }
        //check that the user is not also selling
        if (id in market[1]){
            response += ', you can\'t create a buy posting, you are already selling. ya dingus!\n';
            message.channel.send(response);
            message.author.send('Your posting:\n' + id.padStart(18,'0') + '\tS ' + String(market[1][id].quantity).padStart(10,' ') + '\t@' + String(market[1][id].price).padStart(8,' ') + '\n');
            return;
        }
        response += ', is buyin\' who\'s sellin\'?';    

        // ledger
        userData.gold -= value;
        var userData = ledger[id];
        market[0][id] = {
                username: ledger[id].username,
                price: parseFloat(price),
                quantity: parseFloat(coinage)
                };
    }
    else if (command == 'sell'){
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
        // check user funds
        const value = amount;
        if (userData.meatCoin < value) {
            message.channel.send(response + ', you have insufficient meatCoin. ' + value + ' meatCoin is required.');
            return;
        }
        //check that the user is not already buying
        if (id in market[0]){
            response += ', you can\'t create a sell posting, you are already buying. ya dingus!\n';
            message.channel.send(response);
            message.author.send('Your posting:\n' + id.padStart(18,'0') + '\tB ' + String(market[0][id].quantity).padStart(10,' ') + '\t@' + String(market[0][id].price).padStart(8,' ') + '\n');
            return;
        }
        //check that the user is not also selling
        if (id in market[1]){
            response += ', you can\'t create a sell posting, you are already selling. Use !post adjust.\n';
            message.channel.send(response);
            message.author.send('Your posting:\n' + id.padStart(18,'0') + '\tS ' + String(market[1][id].quantity).padStart(10,' ') + '\t@' + String(market[1][id].price).padStart(8,' ') + '\n');
            return;
        }
        response += ', is looking to unload some meat, get it while it\'s hot';

         // ledger
        userData.meatCoin -= value;
        market[1][id] = {
                username: ledger[id].username,
                price: parseFloat(price),
                quantity: parseFloat(coinage)
                };
    }
    else if (command == 'adjust'){
        //adjusting a buy
        if (id in market[0]){
            //remvoing post
            if (amount <= 0.0 || floatPrice <= 0.0){
                var postingData = market[0][id];
                var refund = (1.0-postFee) * (postingData.price * postingData.quantity);
                delete market[0][id];
                response += ', your posting has been removed\n'
                message.author.send('Your posting:\n' + id.padStart(18,'0') + '\tB ' + String(postingData.quantity).padStart(10,' ') + '\t@' + String(postingData.price).padStart(8,' ') + '\n');
                ledger[id].gold += refund;
                message.author.send('Has been cancelled. You have been credited ' + refund + ' gold\n');
            }
            else{
                var postingData = market[0][id];
                var xactFee = (postFee) * (postingData.price * postingData.quantity);
                var difference = (postingData.price * postingData.quantity) - (amount * floatPrice);
                var refund = difference - xactFee;
                if(refund >= 0){
                    ledger[id].gold += refund;
                    message.author.send('Your posting:\n' + id.padStart(18,'0') + '\tB ' + String(postingData.quantity).padStart(10,' ') + '\t@' + String(postingData.price).padStart(8,' ') + '\n');
                    postingData.price = price;
                    postingData.quantity = coinage;
                    response += ', your posting has been updated';
                    message.author.send('Has been updated to:\n' + id.padStart(18,'0') + '\tB ' + String(postingData.quantity).padStart(10,' ') + '\t@' + String(postingData.price).padStart(8,' ') + '\n');
                    message.author.send('For a refund of ' + Math.abs(refund).toFixed(2) + ' gold');
                }
                else{
                    //need to pay more check if you have enough
                    if(ledger[id].gold < Math.abs(refund)){
                        response += ', you dont have enough money to alter your posting, you need ' + Math.abs(refund) + ' gold.';
                        message.channel.send(response);
                        return;
                    }
                    //take the extra
                    else{
                        ledger[id].gold += refund;
                        message.author.send('Your posting:\n' + id.padStart(18,'0') + '\tB ' + String(postingData.quantity).padStart(10,' ') + '\t@' + String(postingData.price).padStart(8,' ') + '\n');
                        postingData.price = price;
                        postingData.quantity = coinage;
                        response += ', your posting has been updated';
                        message.author.send('Has been updated to:\n' + id.padStart(18,'0') + '\tB ' + String(postingData.quantity).padStart(10,' ') + '\t@' + String(postingData.price).padStart(8,' ') + '\n');
                        message.author.send('For a price of ' + Math.abs(refund).toFixed(2) + ' gold');
                    }
                }
            }
        }
        //adjusting a sell
        else if (id in market[1]){
            //removing post
            if (amount <= 0.0 || floatPrice <= 0.0){
                var postingData = market[1][id];
                var refund = (1.0-postFee) * (postingData.quantity);
                delete market[1][id];
                response += ', your posting has been removed\n'
                message.author.send('Your posting:\n' + id.padStart(18,'0') + '\tS ' + String(postingData.quantity).padStart(10,' ') + '\t@' + String(postingData.price).padStart(8,' ') + '\n');
                ledger[id].meatCoin += refund;
                message.author.send('Has been cancelled. You have been credited ' + refund + ' meatCoin\n');
            }
            else{
                var postingData = market[1][id];
                var xactFee = (postFee) * postingData.quantity;
                var difference = postingData.quantity - amount;
                var refund = difference - xactFee;
                if(refund >= 0){
                    ledger[id].meatCoin += refund;
                    message.author.send('Your posting:\n' + id.padStart(18,'0') + '\tS ' + String(postingData.quantity).padStart(10,' ') + '\t@' + String(postingData.price).padStart(8,' ') + '\n');
                    postingData.price = price;
                    postingData.quantity = coinage;
                    response += ', your posting has been updated';
                    message.author.send('Has been updated to:\n' + id.padStart(18,'0') + '\tS ' + String(postingData.quantity).padStart(10,' ') + '\t@' + String(postingData.price).padStart(8,' ') + '\n');
                    message.author.send('For a refund of ' + Math.abs(refund).toFixed(2) + ' meatCoin');
                }
                else{
                    //need to pay more check if you have enough
                    if(ledger[id].meatCoin < Math.abs(refund)){
                        response += ', you dont have enough money to alter your posting, you need ' + Math.abs(meatCoin) + ' meatCoin.';
                        message.channel.send(response);
                        return;
                    }
                    //take the extra
                    else{
                        ledger[id].meatCoin += refund;
                        message.author.send('Your posting:\n' + id.padStart(18,'0') + '\tB ' + String(postingData.quantity).padStart(10,' ') + '\t@' + String(postingData.price).padStart(8,' ') + '\n');
                        postingData.price = price;
                        postingData.quantity = coinage;
                        response += ', your posting has been updated';
                        message.author.send('Has been updated to:\n' + id.padStart(18,'0') + '\tB ' + String(postingData.quantity).padStart(10,' ') + '\t@' + String(postingData.price).padStart(8,' ') + '\n');
                        message.author.send('For a price of ' + Math.abs(refund).toFixed(2) + ' meatCoin');
                    }
                }
            }
        }
        else{
            response += ', you have no postings!';
        }

    }
    else{
        response += ', ' + command + ' is not a valid command. ya dingus!';
    }

    message.channel.send(response);
    processMarket();
}

function processMarket(){
    var buyers = market[0];
    var sellers = market[1];
    //iterate through buyers
    if (Object.keys(buyers).length > 0) {
        Object.keys(buyers).forEach(function(Bkey) {
            //iterate through sellers
            if (Object.keys(sellers).length > 0) {
                Object.keys(sellers).forEach(function(Skey) {
                    // check if we can make a deal
                    if(buyers[Bkey].price >= sellers[Skey].price){ //price match
                        var negPrice = buyers[Bkey].price; //probably won't happen too much, but good to be safe, buyers lose
                        //Buying > Selling
                        if(buyers[Bkey].quantity > sellers[Skey].quantity){ 
                            var buyerData = ledger[Bkey];
                            var sellerData = ledger[Skey];
                            //credit both parties as they have already paid
                            buyerData.meatCoin += parseFloat(sellers[Skey].quantity);
                            volume.traded += parseFloat(sellers[Skey].quantity);
                            sellerData.gold += sellers[Skey].quantity * negPrice;
                            if (buyerData.history.length > 9)
                                buyerData.history.pop();
                            buyerData.history.unshift('b' + ',' + parseFloat(sellers[Skey].quantity).toFixed(2) + ',' + negPrice.toFixed(2));
                            if (sellerData.history.length > 9)
                                sellerData.history.pop();
                            sellerData.history.unshift('s' + ',' + parseFloat(sellers[Skey].quantity).toFixed(2) + ',' + negPrice.toFixed(2));
                            //decrease buyer quantity by amount sold, remove seller posting
                            buyers[Bkey].quantity -= sellers[Skey].quantity;
                            delete sellers[Skey];
                        }
                        //Selling > Buying
                        else if (sellers[Skey].quantity > buyers[Bkey].quantity){
                            var buyerData = ledger[Bkey];
                            var sellerData = ledger[Skey];
                            //credit both parties as they have already paid
                            buyerData.meatCoin += parseFloat(buyers[Bkey].quantity);
                            volume.traded += parseFloat(buyers[Bkey].quantity);
                            sellerData.gold += buyers[Bkey].quantity * negPrice;
                            if (buyerData.history.length > 9)
                                buyerData.history.pop();
                            buyerData.history.unshift('b' + ',' + parseFloat(buyers[Bkey].quantity).toFixed(2) + ',' + negPrice.toFixed(2));
                            if (sellerData.history.length > 9)
                                sellerData.history.pop();
                            sellerData.history.unshift('s' + ',' + parseFloat(buyers[Bkey].quantity).toFixed(2) + ',' + negPrice.toFixed(2));
                            //decrease seller quantity by amount sold, remove buyer posting
                            sellers[Skey].quantity -= buyers[Bkey].quantity;
                            delete buyers[Bkey];
                        }
                        //equal
                        else{
                            var buyerData = ledger[Bkey];
                            var sellerData = ledger[Skey];
                            //credit both parties as they have already paid
                            buyerData.meatCoin += parseFloat(buyers[Bkey].quantity);
                            volume.traded += parseFloat(buyers[Bkey].quantity);
                            sellerData.gold += buyers[Bkey].quantity * negPrice;
                            if (buyerData.history.length > 9)
                                buyerData.history.pop();
                            buyerData.history.unshift('b' + ',' + parseFloat(buyers[Bkey].quantity).toFixed(2) + ',' + negPrice.toFixed(2));
                            if (sellerData.history.length > 9)
                                sellerData.history.pop();
                            sellerData.history.unshift('s' + ',' + parseFloat(buyers[Bkey].quantity).toFixed(2) + ',' + negPrice.toFixed(2));
                            //decrease seller quantity by amount sold, remove buyer posting
                            delete sellers[Skey];
                            delete buyers[Bkey];
                        }
                    }
                })
            }
        });
    }
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
