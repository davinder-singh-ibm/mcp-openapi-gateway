/**
 * Tool registry
 * Manages the collection of MCP tools and their metadata
 */

import { MCPTool, ToolMetadata } from '../config/types.js';
import { GeneratedTool } from './toolGenerator.js';
import * as logger from '../utils/logger.js';

export class ToolRegistry {
  private tools: Map<string, MCPTool> = new Map();
  private metadata: Map<string, ToolMetadata> = new Map();

  constructor(generatedTools: GeneratedTool[]) {
    for (const { tool, metadata } of generatedTools) {
      this.tools.set(tool.name, tool);
      this.metadata.set(tool.name, metadata);
    }

    logger.info('Tool registry initialized', {
      toolCount: this.tools.size,
    });
  }

  listTools(): MCPTool[] {
    return Array.from(this.tools.values());
  }

  getTool(name: string): MCPTool | undefined {
    return this.tools.get(name);
  }

  getMetadata(name: string): ToolMetadata | undefined {
    return this.metadata.get(name);
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  getToolCount(): number {
    return this.tools.size;
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  getToolsByService(serviceName: string): MCPTool[] {
    const tools: MCPTool[] = [];
    
    for (const [name, tool] of this.tools.entries()) {
      const metadata = this.metadata.get(name);
      if (metadata?.serviceName === serviceName) {
        tools.push(tool);
      }
    }

    return tools;
  }

  getServiceNames(): string[] {
    const services = new Set<string>();
    
    for (const metadata of this.metadata.values()) {
      services.add(metadata.serviceName);
    }

    return Array.from(services);
  }
}

// Made with Bob
