const { createLogger, format, transports } = require('winston');
const { splat, combine, timestamp, label, printf } = format;

const config = require('../config.json');
const logLevel = config.logger.level || config.logLevel || 'debug';



module.exports = {
    getLogger: function (loggerName, coin) {


        let transportz = [new transports.Console()];

        if(config.logger && config.logger.file) {
            Object.keys(config.logger.file).forEach((logLevel)=> {
                transportz.push(new transports.File({ filename: config.logger.file[logLevel], level: logLevel }))
            })
        }

        return createLogger({
            format: combine(
                splat(),
                label({label: {loggerName: loggerName, coin:coin}}),
                timestamp(),
                printf(info => {
                    return `[${info.timestamp}] [${info.level}] [${info.label.coin}] [${info.label.loggerName}] : ${info.message}`;
                })
            ),
            level: logLevel,
            transports: transportz,
        });
    },
};