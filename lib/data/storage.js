const fs = require('fs');
const path = require('path');

const storageFileName = 'storage.json';

module.exports = {
    loadSync: function () {
        const rootPath = process.cwd();
        const storageFilePath = path.join(rootPath, 'lib', 'data', storageFileName);

        const data = fs.readFileSync(storageFilePath);
        if (data)
            return JSON.parse(data);
    },

    loadAsync: function () {
        const rootPath = process.cwd();
        const storageFilePath = path.join(rootPath, 'lib', 'data', storageFileName);

        const data = fs.readFile(storageFilePath, function(err) {
            if (err) {
                console.log('Error loading: ' + storageFilePath);
                return console.log(err);
            }
        });

        if (data)
            return JSON.parse(data);
    },

    saveSync: function (data) {
        const rootPath = process.cwd();
        const storageFilePath = path.join(rootPath, 'lib', 'data', storageFileName);

        fs.writeFileSync(storageFilePath, data);
    },

    saveAsync: function (data) {
        const rootPath = process.cwd();
        const storageFilePath = path.join(rootPath, 'lib', 'data', storageFileName);

        fs.writeFile(storageFilePath, data, function(err) {
            if (err) {
                console.log('Error writing: ' + storageFilePath);
                return console.log(err);
            }
        });
    }
};