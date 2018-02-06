const { createLogger, format, transports } = require('winston');
const { splat, combine, timestamp, label, printf } = format;

const logLevel = 'silly';


module.exports = {
    getLogger: function (loggerName) {
        return createLogger({
            format: combine(
                splat(),
                label({label: loggerName}),
                timestamp(),
                printf(info => {
                    return `[${info.timestamp}] [${info.level}] [${info.label}] : ${info.message}`;
                })
            ),
            level: logLevel,
            transports: [new transports.Console()
            ],
        });
    },
};