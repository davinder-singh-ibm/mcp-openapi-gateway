/**
 * MCP request handlers
 * Implements tools/list and tools/call handlers
 */
import { ToolRegistry } from '../tools/toolRegistry.js';
import { MCPToolsListResponse, MCPCallToolResponse, MCPErrorObject } from './mcpTypes.js';
export declare class MCPHandlers {
    private registry;
    constructor(registry: ToolRegistry);
    handleToolsList(): Promise<MCPToolsListResponse>;
    handleToolCall(toolName: string, args: any, correlationId: string): Promise<{
        response?: MCPCallToolResponse;
        error?: MCPErrorObject;
    }>;
    private validateInput;
}
//# sourceMappingURL=mcpHandlers.d.ts.map