/**
 * Structured logging utility with correlation ID support
 * Never logs secrets or tokens
 */
let currentLogLevel = 'info';
const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};
export function setLogLevel(level) {
    currentLogLevel = level;
}
function shouldLog(level) {
    return LOG_LEVELS[level] >= LOG_LEVELS[currentLogLevel];
}
function sanitizeContext(context) {
    const sanitized = { ...context };
    // Remove sensitive fields
    const sensitiveKeys = [
        'authorization',
        'api-key',
        'x-api-key',
        'bearer',
        'token',
        'secret',
        'password',
        'apiKey',
        'bearerToken',
        'clientSecret',
        'accessToken',
    ];
    for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
            sanitized[key] = '[REDACTED]';
        }
    }
    return sanitized;
}
function formatLog(level, message, context) {
    const timestamp = new Date().toISOString();
    const sanitizedContext = context ? sanitizeContext(context) : {};
    return JSON.stringify({
        timestamp,
        level,
        message,
        ...sanitizedContext,
    });
}
export function debug(message, context) {
    if (shouldLog('debug')) {
        console.log(formatLog('debug', message, context));
    }
}
export function info(message, context) {
    if (shouldLog('info')) {
        console.log(formatLog('info', message, context));
    }
}
export function warn(message, context) {
    if (shouldLog('warn')) {
        console.warn(formatLog('warn', message, context));
    }
}
export function error(message, context) {
    if (shouldLog('error')) {
        console.error(formatLog('error', message, context));
    }
}
export function generateCorrelationId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
// Made with Bob
//# sourceMappingURL=logger.js.map