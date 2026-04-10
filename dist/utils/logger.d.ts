/**
 * Structured logging utility with correlation ID support
 * Never logs secrets or tokens
 */
import { LogLevel, LogContext } from '../config/types.js';
export declare function setLogLevel(level: LogLevel): void;
export declare function debug(message: string, context?: LogContext): void;
export declare function info(message: string, context?: LogContext): void;
export declare function warn(message: string, context?: LogContext): void;
export declare function error(message: string, context?: LogContext): void;
export declare function generateCorrelationId(): string;
//# sourceMappingURL=logger.d.ts.map