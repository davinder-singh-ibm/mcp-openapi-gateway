/**
 * MCP response formatter
 * Formats HTTP responses into MCP-compliant responses
 */
import { HTTPResponse, MCPToolResponse } from '../config/types.js';
export declare function formatMCPResponse(httpResponse: HTTPResponse, correlationId: string): MCPToolResponse;
export declare function formatErrorResponse(error: Error, correlationId: string): MCPToolResponse;
//# sourceMappingURL=mcpResponseFormatter.d.ts.map