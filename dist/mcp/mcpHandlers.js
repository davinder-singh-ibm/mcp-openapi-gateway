/**
 * MCP request handlers
 * Implements tools/list and tools/call handlers
 */
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { buildHttpRequest } from '../http/requestBuilder.js';
import { executeHttpRequest } from '../http/httpClient.js';
import { formatMCPResponse, formatErrorResponse } from './mcpResponseFormatter.js';
import { createToolNotFoundError, createValidationError, createToolExecutionError, httpStatusToMCPError, } from './mcpErrors.js';
import * as logger from '../utils/logger.js';
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
export class MCPHandlers {
    registry;
    constructor(registry) {
        this.registry = registry;
    }
    async handleToolsList() {
        const tools = this.registry.listTools();
        logger.info('Handling tools/list request', {
            toolCount: tools.length,
        });
        return {
            tools: tools.map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema,
            })),
        };
    }
    async handleToolCall(toolName, args, correlationId) {
        logger.info('Handling tools/call request', {
            correlationId,
            toolName,
        });
        // Check if tool exists
        const tool = this.registry.getTool(toolName);
        if (!tool) {
            logger.warn('Tool not found', {
                correlationId,
                toolName,
            });
            return { error: createToolNotFoundError(toolName) };
        }
        // Get tool metadata
        const metadata = this.registry.getMetadata(toolName);
        if (!metadata) {
            logger.error('Tool metadata not found', {
                correlationId,
                toolName,
            });
            return {
                error: createToolExecutionError('Tool metadata not found'),
            };
        }
        // Validate input against schema
        const validationResult = this.validateInput(tool.inputSchema, args);
        if (!validationResult.valid) {
            logger.warn('Input validation failed', {
                correlationId,
                toolName,
                errors: validationResult.errors,
            });
            return {
                error: createValidationError('Input validation failed', validationResult.errors),
            };
        }
        try {
            // Parse invocation arguments
            const invocation = {
                path: args?.path,
                query: args?.query,
                headers: args?.headers,
                body: args?.body,
            };
            // Build HTTP request
            const httpRequest = await buildHttpRequest(invocation, metadata, correlationId);
            // Execute HTTP request
            const httpResponse = await executeHttpRequest(httpRequest, correlationId);
            // Check for HTTP errors
            if (httpResponse.status >= 400) {
                logger.warn('HTTP request returned error status', {
                    correlationId,
                    status: httpResponse.status,
                    statusText: httpResponse.statusText,
                });
                return {
                    error: httpStatusToMCPError(httpResponse.status, httpResponse.statusText, httpResponse.data),
                };
            }
            // Format successful response
            const mcpResponse = formatMCPResponse(httpResponse, correlationId);
            logger.info('Tool call completed successfully', {
                correlationId,
                toolName,
                status: httpResponse.status,
            });
            return { response: mcpResponse };
        }
        catch (error) {
            logger.error('Tool call execution failed', {
                correlationId,
                toolName,
                error: error.message,
            });
            const mcpResponse = formatErrorResponse(error, correlationId);
            return { response: mcpResponse };
        }
    }
    validateInput(schema, input) {
        const validate = ajv.compile(schema);
        const valid = validate(input || {});
        if (!valid && validate.errors) {
            return {
                valid: false,
                errors: validate.errors.map(err => ({
                    path: err.instancePath,
                    message: err.message,
                    params: err.params,
                })),
            };
        }
        return { valid: true };
    }
}
// Made with Bob
//# sourceMappingURL=mcpHandlers.js.map