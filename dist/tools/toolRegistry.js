/**
 * Tool registry
 * Manages the collection of MCP tools and their metadata
 */
import * as logger from '../utils/logger.js';
export class ToolRegistry {
    tools = new Map();
    metadata = new Map();
    constructor(generatedTools) {
        for (const { tool, metadata } of generatedTools) {
            this.tools.set(tool.name, tool);
            this.metadata.set(tool.name, metadata);
        }
        logger.info('Tool registry initialized', {
            toolCount: this.tools.size,
        });
    }
    listTools() {
        return Array.from(this.tools.values());
    }
    getTool(name) {
        return this.tools.get(name);
    }
    getMetadata(name) {
        return this.metadata.get(name);
    }
    hasTool(name) {
        return this.tools.has(name);
    }
    getToolCount() {
        return this.tools.size;
    }
    getToolNames() {
        return Array.from(this.tools.keys());
    }
    getToolsByService(serviceName) {
        const tools = [];
        for (const [name, tool] of this.tools.entries()) {
            const metadata = this.metadata.get(name);
            if (metadata?.serviceName === serviceName) {
                tools.push(tool);
            }
        }
        return tools;
    }
    getServiceNames() {
        const services = new Set();
        for (const metadata of this.metadata.values()) {
            services.add(metadata.serviceName);
        }
        return Array.from(services);
    }
}
// Made with Bob
//# sourceMappingURL=toolRegistry.js.map