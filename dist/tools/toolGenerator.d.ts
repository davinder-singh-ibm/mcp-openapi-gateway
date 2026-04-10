/**
 * MCP tool generator
 * Generates MCP tools from OpenAPI operations
 */
import { MCPTool, ToolMetadata, OpenAPISpec, SwaggerConfig } from '../config/types.js';
export interface GeneratedTool {
    tool: MCPTool;
    metadata: ToolMetadata;
}
export declare function generateToolsFromSpec(spec: OpenAPISpec, config: SwaggerConfig, toolPrefix: string, serviceNameMode: 'host' | 'title' | 'custom', defaultServiceName: string): GeneratedTool[];
export declare function generateAllTools(specs: Array<{
    config: SwaggerConfig;
    spec: OpenAPISpec;
}>, toolPrefix: string, serviceNameMode: 'host' | 'title' | 'custom', defaultServiceName: string, maxTools?: number): GeneratedTool[];
//# sourceMappingURL=toolGenerator.d.ts.map