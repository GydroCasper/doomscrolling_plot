import winston from 'winston';

export const logger = winston.createLogger({
    level: 'info',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console()
    ]
});

// Add a writable stream dynamically
export function addStreamTransport(stream: NodeJS.WritableStream) {
    const transport = new winston.transports.Stream({ stream });
    logger.add(transport);
    return () => logger.remove(transport); // returns cleanup function
}
