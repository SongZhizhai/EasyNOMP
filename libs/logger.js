const { createLogger, format, transports } = require('winston');
const { splat, combine, timestamp, label, printf } = format;

const logLevel = 'debug';


module.exports = {
    getLogger: function (loggerName, coin) {
        return createLogger({
            format: combine(
                splat(),
                label({label: loggerName, coin: coin}),
                timestamp(),
                printf(info => {
                    return `[${info.timestamp}] [${info.level}] [${info.coin}] [${info.label}] : ${info.message}`;
                })
            ),
            level: logLevel,
            transports: [new transports.Console()
            ],
        });
    },
};