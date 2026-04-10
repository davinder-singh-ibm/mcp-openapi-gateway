/**
 * MCP tool generator
 * Generates MCP tools from OpenAPI operations
 */
import { parseOpenAPISpec, resolveBaseUrl, getServiceName } from '../openapi/openapiParser.js';
import { buildToolName, detectNameCollisions } from './nameBuilder.js';
import { buildToolInputSchema, buildToolDescription } from './schemaBuilder.js';
import * as logger from '../utils/logger.js';
export function generateToolsFromSpec(spec, config, toolPrefix, serviceNameMode, defaultServiceName) {
    const operations = parseOpenAPISpec(spec);
    const serviceName = getServiceName(spec, config.url, serviceNameMode, defaultServiceName);
    const baseUrl = resolveBaseUrl(spec, config.url, config.baseUrlOverride);
    logger.info('Generating tools from OpenAPI spec', {
        serviceName,
        baseUrl,
        operationCount: operations.length,
    });
    const generatedTools = [];
    for (const operation of operations) {
        const toolName = buildToolName(operation, serviceName, toolPrefix);
        const description = buildToolDescription(operation);
        const inputSchema = buildToolInputSchema(operation);
        const tool = {
            name: toolName,
            description,
            inputSchema,
        };
        const metadata = {
            serviceName,
            baseUrl,
            httpMethod: operation.method,
            path: operation.path,
            operation: operation.operation,
            auth: config.auth || { type: 'none' },
        };
        generatedTools.push({ tool, metadata });
    }
    // Check for name collisions
    const toolNames = generatedTools.map(gt => gt.tool.name);
    const collisions = detectNameCollisions(toolNames);
    if (collisions.size > 0) {
        const collisionList = Array.from(collisions.entries())
            .map(([name, count]) => `${name} (${count} times)`)
            .join(', ');
        logger.error('Tool name collisions detected', {
            serviceName,
            collisions: collisionList,
        });
        throw new Error(`Tool name collisions detected in ${serviceName}: ${collisionList}. ` +
            'Consider using operationId in your OpenAPI spec or adjusting SERVICE_NAME_MODE.');
    }
    logger.info('Successfully generated tools', {
        serviceName,
        toolCount: generatedTools.length,
    });
    return generatedTools;
}
export function generateAllTools(specs, toolPrefix, serviceNameMode, defaultServiceName, maxTools) {
    const allTools = [];
    for (const { config, spec } of specs) {
        const tools = generateToolsFromSpec(spec, config, toolPrefix, serviceNameMode, defaultServiceName);
        allTools.push(...tools);
    }
    // Check global name collisions across all specs
    const allToolNames = allTools.map(gt => gt.tool.name);
    const globalCollisions = detectNameCollisions(allToolNames);
    if (globalCollisions.size > 0) {
        const collisionList = Array.from(globalCollisions.entries())
            .map(([name, count]) => `${name} (${count} times)`)
            .join(', ');
        logger.error('Global tool name collisions detected across specs', {
            collisions: collisionList,
        });
        throw new Error(`Tool name collisions detected across multiple specs: ${collisionList}. ` +
            'Consider using TOOL_NAME_PREFIX or different SERVICE_NAME_MODE settings.');
    }
    // Apply max tools limit if specified
    if (maxTools && allTools.length > maxTools) {
        logger.warn('Tool count exceeds MAX_TOOLS limit', {
            generated: allTools.length,
            limit: maxTools,
        });
        return allTools.slice(0, maxTools);
    }
    logger.info('Generated all tools successfully', {
        totalTools: allTools.length,
        specCount: specs.length,
    });
    return allTools;
}
// Made with Bob
//# sourceMappingURL=toolGenerator.js.map