import winston from "winston"

const format = winston.format.printf((info) => {
    return `[${info.timestamp}][${info.level}] ${info.message}`
})

export default winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.simple(),
        format,
    ),
    transports: [
        new winston.transports.Console(),
    ],
})
