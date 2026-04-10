/**
 * Tool registry
 * Manages the collection of MCP tools and their metadata
 */
import { MCPTool, ToolMetadata } from '../config/types.js';
import { GeneratedTool } from './toolGenerator.js';
export declare class ToolRegistry {
    private tools;
    private metadata;
    constructor(generatedTools: GeneratedTool[]);
    listTools(): MCPTool[];
    getTool(name: string): MCPTool | undefined;
    getMetadata(name: string): ToolMetadata | undefined;
    hasTool(name: string): boolean;
    getToolCount(): number;
    getToolNames(): string[];
    getToolsByService(serviceName: string): MCPTool[];
    getServiceNames(): string[];
}
//# sourceMappingURL=toolRegistry.d.ts.map