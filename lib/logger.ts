import pino from 'pino';

// Configuration for pino
const config = {
    // In development, we use 'debug' level. In production, 'info'
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

    // Browser configuration
    browser: {
        asObject: true, // Log as objects so browser console can inspect them
    },
};

// Create the raw pino logger instance
const pinoLogger = pino(config);

// Helper function to handle arguments safely
const logWrapper = (level: string, message: string, data?: any) => {
    if (data) {
        // Pino expects the object as the first argument to merge it into the log record
        // @ts-ignore - Dynamic access to pino methods
        pinoLogger[level]({ data }, message);
    } else {
        // @ts-ignore
        pinoLogger[level](message);
    }
};

// Export a logger object that matches our previous interface: (message, data?)
export const logger = {
    error: (message: string, data?: any) => logWrapper('error', message, data),
    warn: (message: string, data?: any) => logWrapper('warn', message, data),
    info: (message: string, data?: any) => logWrapper('info', message, data),
    http: (message: string, data?: any) => logWrapper('info', message, data), // Map http to info
    debug: (message: string, data?: any) => logWrapper('debug', message, data),
};

export default logger;
