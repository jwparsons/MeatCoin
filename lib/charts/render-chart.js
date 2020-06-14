const fs = require('fs');
const path = require('path');
const vega = require('vega');

const lineChartSpecFileName = 'line-chart.spec.json'
const renderedLineChartFileName = 'price-chart.png';

module.exports = {
    line_chart: function (priceHistory, callback) {
        const rootPath = process.cwd();
        const lineChartSpecPath = path.join(rootPath, 'lib', 'charts', lineChartSpecFileName);
        const renderedLineChartFilePath = path.join(rootPath, 'lib', 'charts', renderedLineChartFileName);

        console.log('Parsing line chart spec...');
        fs.readFile(lineChartSpecPath, function(err, data) {
            if(err) {
                console.log("Error parsing line chart spec: ");
                return console.log(err);
            }

            console.log('Editing line chart data...');
            var lineChartSpecData = JSON.parse(data);
            lineChartSpecData.data[0].values = priceHistory;

            console.log('Rendering PNG...');
            var view = new vega.View(vega.parse(lineChartSpecData)).renderer('canvas').initialize();
            view.toCanvas().then(function (canvas) {
                stream = canvas.createPNGStream();

                console.log('Writing PNG to file...');
                fs.writeFile(renderedLineChartFilePath, canvas.toBuffer(), function(err) {
                    if (err) {
                        console.log("Error writing PNG to file: ");
                        return console.log(err);
                    }

                    callback(renderedLineChartFilePath);
                });
            }).catch(function (err) {
                console.log("Error rendering PNG: ");
                return console.error(err);
            });
        });
    }
};