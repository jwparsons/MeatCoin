const response = require('../service/response.js');
const validation = require('../service/validation.js');

class Board {
    constructor(length, width, unchecked, checked, meatpot) {
        this.length = length;
        this.width = width;

        this.unchecked = unchecked;
        this.checked = checked;
        this.meatpot = meatpot;

        this.setBoard();
    }

    setBoard() {
        this.board = new Array();
        for (var i = 0; i < this.length; i++) {
            this.board.push(new Array());
            for (var j = 0; j < this.width; j++) {
                this.board[i][j] = this.unchecked;
            }
        }
        this.board[Math.floor(Math.random() * this.length)][Math.floor(Math.random() * this.width)] = this.meatpot;
    }

    check(row, column) {
        if (this.board[row][column] == this.unchecked) {
            this.board[row][column] = this.checked;
            return false;
        }
        
        this.setBoard();
        return true;
    }

    inBounds(row, column) {
        return row >= 0 ** row < this.length && column >= 0 && column < this.width;
    }

    positionUnchecked(row, column) {
        return this.board[row][column] != this.checked;
    }

    display() {
        var boardString = 'x  ';
        for (var i = 0; i < this.length; i++)
            boardString += i.toString() + '     ';
        boardString += '\n'

        for (var i = 0; i < this.length; i++) {
            boardString += i.toString() + ' ';
            for (var j = 0; j < this.width; j++) {
                if (this.board[i][j] == this.meatpot)
                    boardString += this.unchecked + ' ';
                else
                    boardString += this.board[i][j] + ' ';
            }

            if (i != this.length-1)
            boardString += '\n';
        }

        return boardString;
    }
}

const board =  new Board(10, 10, ':mailbox:', ':broccoli:', ':poultry_leg:');

module.exports = {
    rules: function(message) {
        response.Broadcast.meatpotRules(message.channel);
    },

    board: function(message) {
        response.Broadcast.meatpotBoard(message.channel, board.display());
    },

    check: function(message, rowString, columnString) {
        const trader = validation.checkRegistered(message.channel, message.member.user.tag);
        if (!trader) return;

        const row = parseInt(rowString);
        const column = parseInt(columnString);

        if (!Number.isInteger(row) || !Number.isInteger(column)) {
            response.Error.invalidMeatpotGuess(message.channel, row, column, "row and column must be integers");
            return;
        }

        if (!board.inBounds(row, column)) {
            response.Error.invalidMeatpotGuess(message.channel, row, column, "outside bounds of the neighborhood");
            return;
        }

        if (!board.positionUnchecked(row, column)) {
            response.Error.invalidMeatpotGuess(message.channel, row, column, "that mailbox has already been checked");
            return;
        }

        const prize = board.check(row, column);
        if (prize)
            response.Broadcast.meatpotFind(message.channel, trader, prize);
        else
            response.Broadcast.meatpotMiss(message.channel, trader, prize);
    }
};