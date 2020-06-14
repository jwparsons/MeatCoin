const server = require('./server.js');

class Broadcast {
    constructor() {}

    static help(channel) {
        var message = '[MeatCoin v2.4.2]';
        message += '\n\t#info';
        message += '\n\t\t!balance';
        message += '\n\t\t!history';
        message += '\n\t\t!price';
        message += '\n\t\t!price chart';
        message += '\n\t\t!volume';
        message += '\n\t\t!leaderboard';
        message += '\n\t\t!advice';
        message += '\n\n\t#weigners';
        message += '\n\t\t!prize';
        message += '\n\t\t!victory';
        message += '\n\t\t!hall of fame';
        message += '\n\n\t#brokerage';
        message += '\n\t\t!register';
        message += '\n\t\t!buy <amount m¢/max>';
        message += '\n\t\t!sell <amount m¢/max>';
        message += '\n\n\t#gamble';
        message += '\n\t\t!flip rules';
        message += '\n\t\t!flip <ribs/loins> <amount m¢>';
        message += '\n\t\t!dice rules';
        message += '\n\t\t!dice challenge <name#tag> <amount m¢>';
        message += '\n\t\t!dice accept <name#tag> <amount m¢>';
        message += '\n\t\t!meatpot info';
        message += '\n\t\t!meatpot board';
        message += '\n\t\t!meatpot check <row> <column>';
        message += '\n\n\t#coerce';
        message += '\n\t\t!send <name#tag> <amount m¢>';

        channel.send(cssFormat(message));
    }

    static balance(channel, trader) {
        var message = trader.tag + '\n';
        message += '\t' + trader.gold.toFixed(2) + ' gold\n';
        message += '\t' + trader.meat.toFixed(2) + ' m¢\n';
        message += '\t' + (trader.gold + trader.meat * server.Data.price).toFixed(2) + ' unrealized';

        channel.send(standardFormat(message));
    }

    static history(channel, trader) {
        var message = trader.tag;

        if (trader.history.length == 0)
            message += '\nempty'
        else {
            for (let i = 0; i < trader.history.length; i++) {
                message += '\n';
                const entry = trader.history[i].split(',');
                if (entry[0] == 'b')
                    message += '\tBought ';
                else
                    message += '\tSold ';
                message += entry[1] + ' m¢ @ ' + entry[2] + ' gold.';
            }
        }

        channel.send(standardFormat(message));
    }

    static price(channel) {
        var message = standardFormat('1 m¢ = ' + server.Data.price.toFixed(2) + ' gold.');
        channel.send(message);
    }

    static priceChart(channel, priceChartFilePath, serverStartTime) { 
        var message = 'The price history of m¢ starting from ' + serverStartTime.toLocaleTimeString() + '.';
        channel.send(glslFormat(message), {files: [priceChartFilePath]});
    }

    static volume(channel) {
        var message = 'Trading Session\n'
        message += '\t' + server.Stats.volume.bought.toFixed(2) + ' m¢ bought.\n';
        message += '\t' + server.Stats.volume.sold.toFixed(2) + ' m¢ sold.\n';
        message += '\t' + server.Stats.volume.gambled.toFixed(2) + ' m¢ gambled.';

        channel.send(standardFormat(message));
    }
    
    static leaderboard(channel, leadingTraders) {
        var message = '';
        for (let i = 0; i < leadingTraders.length; i++) {
            const gold = leadingTraders[i].gold.toFixed(2);
            const meatcoin = leadingTraders[i].meat.toFixed(2);
            const value = leadingTraders[i].value().toFixed(2);
            message += (i + 1) + '. ' + leadingTraders[i].tag + ' - ' + gold + ' gold + ' + meatcoin + ' $mc = ' + value + ' gold';
            if (i + 1 != leadingTraders.length)
                message += '\n';
        }

        channel.send(standardFormat(message));
    }

    static advice(channel) {
        var message = '';
        if (Math.random() > 0.5)
            message += 'SELL SELL SELL AHHHHHHHHHHHH!';
        else
            message += 'CALL ME CRAZY BUT IT AINT NO LIE BABY BUY BUY BUY!'

        channel.send(ttsFormat(message), {tts: true});
    }

    static registration(channel, traderTag) {
        const message = traderTag + ' has succesfully registered.';
        channel.send(standardFormat(message));
    }

    static victory(channel, traderTag) {
        const message = traderTag + ' has won m¢. Contact @jamespar for your prize you meaty bitch!';
        channel.send(ttsFormat(message), {tts: true});
    }

    static prize(channel) {  
        const message = 'The prize for winning m¢ is $20. W0ah!!!';
        channel.send(standardFormat(message));
    }

    static hallOfFame(channel) {
        var message = 'Winner of MeatCoin 2.2: The old razzmataz\n';
        message += 'Winner of MeatCoin 3, Reloaded: FatalBagel';

        channel.send(standardFormat(message));
    }

    static flipRules(channel) {
        const message = 'Call ribs/loins. Flip the meat coin. Meat your maker!';
        channel.send(standardFormat(message));
    }

    static flipResult(channel, traderTag, traderIsSuccessful, meatCoinAmount) {
        var message = traderTag;
        if (traderIsSuccessful)
            message += ' has won ' + meatCoinAmount.toFixed(2) + ' m¢!!!';
        else
            message += ' has lost ' + meatCoinAmount.toFixed(2) + ' m¢. LOL!';

        channel.send(standardFormat(message));
    }

    static bought(channel, traderTag, meatCoinAmount, meatCoinGoldValue) {
        var message = traderTag + ' bought ' + meatCoinAmount + ' m¢ for ';
        message +=  meatCoinGoldValue.toFixed(2) + ' gold @ ' + server.Data.price.toFixed(2) + ' gold.';

        channel.send(standardFormat(message));
    }

    static sold(channel, traderTag, meatCoinAmount, meatCoinGoldValue) {
        var message = traderTag + ' sold ' + meatCoinAmount + ' m¢ for ';
        message +=  meatCoinGoldValue.toFixed(2) + ' gold @ ' + server.Data.price.toFixed(2) + ' gold.';

        channel.send(standardFormat(message));
    }

    static diceRules(channel) {
        var message = 'Each player rols two dice. The player with the higher value wins.\n';
        message += 'From highest to lowest: \n\t21, 66, 55, 44, 33, 22, 11';
        message +=  '\n\t65, 64, 63, 62, 61, 54, 53';
        message += '\n\t52, 51, 43, 42, 41, 32, 31';

        channel.send(standardFormat(message));
    }

    static diceResult(channel, outcome) {
        channel.send(standardFormat(outcome));
    }

    static diceRoll(channel, trader, roll) {
        var message = trader.tag;
        if (roll == '21')
            message += ' rolls a MIA!!!\n';
        else
            message += ' rolls a ' + roll + '\n';

        channel.send(standardFormat(message));
    }

    static meatpotInfo(channel) {
        var message = '< meatpot >'
        message += '\n# rules';
        message += '\n\tThe meat bandit has stolen the Hope Turkey Leg and placed it in a random mailbox. Check each mailbox to find your prize, but beware of what else may be inside!';
        message += '\n\n# cost'
        message += '\n\t1 m¢/check'
        message += '\n\n# prize'
        message += '\n\tThe current meatpot is ' + server.Stats.meatpot.toFixed(2) + ' m¢!!!';
        channel.send(mdFormat(message));
    }

    static meatpotBoard(channel, boardString) {
        const message = boardString;
        channel.send(message);
    }

    static meatpotFind(channel, trader, prize) {
        const message = 'Oh hell yeah, ' + trader.name + ' got that ' + prize + ' better luck next time, losers. Hahahahahahahahahahahahahahahahahahaha.';
        channel.send(ttsFormat(message), {tts: true});
    }

    static meatpotMiss(channel, trader, prize) {
        const message = 'Dear idiot ' + '(' + trader.tag + '), I hope you like ' + prize + '. GROSS! - Meat Bandit';
        channel.send(standardFormat(message));
    }
}

class Notification {
    static minedGold(channel, traderTag, goldAmount) {
        if (!channel) return;

        const message = traderTag + ' has mined ' + goldAmount + ' gold!!!';
        channel.send(standardFormat(message));
    }

    static diceChallenge(channel, challengerTraderTag, acceptorTraderId, meatCoinAomunt) {
        if (!channel) return;

        const message = challengerTraderTag + ' challenged you to dice @ ' + meatCoinAomunt + ' m¢.';
        channel.send(notificationFormat(acceptorTraderId, message));
    }

    static sentGift(channel, senderTraderTag, receiverTraderId, meatCoinAomunt) {
        if (!channel) return;

        const message = senderTraderTag + ' has sent you ' + meatCoinAomunt + ' m¢.';
        channel.send(notificationFormat(receiverTraderId, message));
    }
}

class Error {
    static notRegistered(channel, traderTag) {
        const message = traderTag + ' is not registered.';
        channel.send(errorFormat(message));
    }

    static alreadyRegistered(channel, traderTag) {
        const message = traderTag + ' is already registered.';
        channel.send(errorFormat(message));
    }

    static victoryNotReached(channel) {
        const message = 'Victory requires 1,000,000 gold. Keep beating that meat!';
        channel.send(errorFormat(message));
    }

    static insufficientGold(channel, traderTag, gold) {
        const message = traderTag + ' has insufficient funds. ' + gold.toFixed(2) + ' gold is required.';
        channel.send(errorFormat(message));
    }

    static insufficientMeat(channel, traderTag, meat) {
        const message = traderTag + ' has insufficient funds. ' + meat.toFixed(2) + ' m¢ is required.';
        channel.send(errorFormat(message));
    }

    static invalidMeatCointAmount(channel, amount) {
        const message = amount + ' is an invalid amount of m¢.';
        channel.send(errorFormat(message));
    }

    static invalidFlipSide(channel, flip) {
        const message = flip + ' is an invalid flip guess (ribs/loins).';
        channel.send(errorFormat(message));
    }

    static selfChallenge(channel) {
        const message = 'Traders cannot challenge themselves.';
        channel.send(errorFormat(message));
    }

    static invalidTag(channel, traderTag) {
        const message = traderTag + ' is an invalid tag (case-sensitive).';
        channel.send(errorFormat(message));
    }

    static challengeExistence(channel, acceptorTrader, challengerTrader) {
        const message = challengerTrader.tag + ' has not challenged ' + acceptorTrader.tag + ' to dice.';
        channel.send(errorFormat(message));
    }

    static betMatch(channel, challengerTag, acceptorTag, proposedBet, acceptedBet) {
        const message = challengerTag + ' has not challenged ' + acceptorTag + ' to dice for ' + acceptedBet + ' m¢. The proposed bet was ' + proposedBet + ' m¢.';
        channel.send(errorFormat(message));
    }

    static selfSend(channel) {
        const message = 'Traders cannot send m¢ to themselves.';
        channel.send(errorFormat(message));
    }

    static invalidMeatpotGuess(channel, row, column, reason) {
        const message = row.toString() + ', ' + column.toString() + ' is invalid: ' + reason + '.';
        channel.send(errorFormat(message));
    }
}

module.exports = {
    Broadcast,
    Notification,
    Error
};

function glslFormat(message) {
    return '```glsl\n' + message + '\n```'
}

function cssFormat(message) {
    return '```css\n' + message + '\n```'
}

function diffFormat(message) {
    return '```diff\n' + message + '\n```'
}

function errorFormat(message) {
    return diffFormat('- Error: ' + message);
}

function notificationFormat(id, message) {
    return '<@' + id + '>, ' + message;
}

function standardFormat(message) {
    return '```autohotkey\n' + message + '```';
}

function ttsFormat(message) {
    return '```' + message + '```';
}

function mdFormat(message) {
    return '```md\n' + message + '```';
}