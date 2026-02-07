import winston from 'winston'

const messageOnly = winston.format.printf((info) => String(info.message))

export const logger = winston.createLogger({
    level: 'info',
    format: messageOnly,
    transports: [
        new winston.transports.Console()
    ]
})

// Add a writable stream dynamically
export function addStreamTransport(stream: NodeJS.WritableStream) {
    const transport = new winston.transports.Stream({stream, format: messageOnly})
    logger.add(transport)
    return () => logger.remove(transport) // returns cleanup function
}
