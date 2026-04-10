/**
 * MCP error handling utilities
 */
import { MCP_ERROR_CODES } from './mcpTypes.js';
export function createMCPError(code, message, data) {
    return {
        code,
        message,
        data,
    };
}
export function createToolNotFoundError(toolName) {
    return createMCPError(MCP_ERROR_CODES.TOOL_NOT_FOUND, `Tool not found: ${toolName}`);
}
export function createValidationError(message, details) {
    return createMCPError(MCP_ERROR_CODES.VALIDATION_ERROR, message, details);
}
export function createToolExecutionError(message, details) {
    return createMCPError(MCP_ERROR_CODES.TOOL_EXECUTION_ERROR, message, details);
}
export function createInvalidRequestError(message) {
    return createMCPError(MCP_ERROR_CODES.INVALID_REQUEST, message);
}
export function createInternalError(message, details) {
    return createMCPError(MCP_ERROR_CODES.INTERNAL_ERROR, message, details);
}
export function httpStatusToMCPError(status, statusText, responseData) {
    let message = `HTTP ${status}: ${statusText}`;
    if (responseData) {
        if (typeof responseData === 'string') {
            message += ` - ${responseData}`;
        }
        else if (responseData.message) {
            message += ` - ${responseData.message}`;
        }
        else if (responseData.error) {
            message += ` - ${responseData.error}`;
        }
    }
    return createToolExecutionError(message, {
        httpStatus: status,
        httpStatusText: statusText,
        responseData,
    });
}
// Made with Bob
//# sourceMappingURL=mcpErrors.js.map