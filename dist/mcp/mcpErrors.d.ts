/**
 * MCP error handling utilities
 */
import { MCPErrorObject } from './mcpTypes.js';
export declare function createMCPError(code: number, message: string, data?: any): MCPErrorObject;
export declare function createToolNotFoundError(toolName: string): MCPErrorObject;
export declare function createValidationError(message: string, details?: any): MCPErrorObject;
export declare function createToolExecutionError(message: string, details?: any): MCPErrorObject;
export declare function createInvalidRequestError(message: string): MCPErrorObject;
export declare function createInternalError(message: string, details?: any): MCPErrorObject;
export declare function httpStatusToMCPError(status: number, statusText: string, responseData?: any): MCPErrorObject;
//# sourceMappingURL=mcpErrors.d.ts.map