const fs = require('fs');
const vega = require('vega');

const lineChartSpecFileName = 'line-chart.spec.json'
const renderedLineChartFileName = 'price-chart.png';

module.exports = {
    line_chart: function (message, priceHistory) {
        const lineChartSpecPath = process.cwd() + '\\charts\\' + lineChartSpecFileName;
        const renderedLineChartFilePath = process.cwd() + '\\charts\\' + renderedLineChartFileName;

        console.log('Parsing line chart spec...');
        fs.readFile(lineChartSpecPath, function(err, data) {
            if(err) {
                console.log("Error parsing line chart spec: ");
                return console.log(err);
            }

            console.log('Editing line chart spec...');
            var lineChartSpecData = JSON.parse(data);
            lineChartSpecData.data[0].values = priceHistory;

            console.log('Rendering PNG...');
            var view = new vega.View(vega.parse(lineChartSpecData)).renderer('canvas').initialize();
            view.toCanvas().then(function (canvas) {
                stream = canvas.createPNGStream();

                console.log('Writing PNG to file...');
                fs.writeFile(renderedLineChartFilePath, canvas.toBuffer(), function(err) {
                    if(err) {
                        console.log("Error writing PNG to file: ");
                        return console.log(err);
                    }

                    console.log('Sending priceChart.png');
                    message.channel.send('The price history of MeatCoin starting from beginning of the trading session:', {files: [renderedLineChartFilePath]});
                });
            }).catch(function (err) {
                console.log("Error rendering PNG: ");
                return console.error(err);
            });
        });
    }
};