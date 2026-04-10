/**
 * Express routes for MCP endpoints
 */

import { Request, Response } from 'express';
import { MCPHandlers } from '../mcp/mcpHandlers.js';
import { MCPRequest, MCPResponse } from '../mcp/mcpTypes.js';
import { createInvalidRequestError, createInternalError } from '../mcp/mcpErrors.js';
import * as logger from '../utils/logger.js';

export function setupRoutes(app: any, handlers: MCPHandlers): void {
  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
    });
  });

  // MCP tools/list endpoint
  app.post('/tools/list', async (req: Request, res: Response) => {
    const correlationId = logger.generateCorrelationId();

    try {
      logger.info('Received tools/list request', { correlationId });

      const result = await handlers.handleToolsList();

      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: req.body?.id,
        result,
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error handling tools/list', {
        correlationId,
        error: error.message,
      });

      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: req.body?.id,
        error: createInternalError(error.message),
      };

      res.status(500).json(response);
    }
  });

  // MCP tools/call endpoint
  app.post('/tools/call', async (req: Request, res: Response) => {
    const correlationId = logger.generateCorrelationId();

    try {
      const mcpRequest = req.body as MCPRequest;

      if (!mcpRequest.params?.name) {
        logger.warn('Missing tool name in request', { correlationId });

        const response: MCPResponse = {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          error: createInvalidRequestError('Missing tool name'),
        };

        res.status(400).json(response);
        return;
      }

      const toolName = mcpRequest.params.name;
      const args = mcpRequest.params.arguments;

      logger.info('Received tools/call request', {
        correlationId,
        toolName,
      });

      const result = await handlers.handleToolCall(toolName, args, correlationId);

      if (result.error) {
        const response: MCPResponse = {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          error: result.error,
        };

        res.status(400).json(response);
        return;
      }

      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: mcpRequest.id,
        result: result.response,
      };

      res.json(response);
    } catch (error: any) {
      logger.error('Error handling tools/call', {
        correlationId,
        error: error.message,
      });

      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: req.body?.id,
        error: createInternalError(error.message),
      };

      res.status(500).json(response);
    }
  });

  // Generic MCP endpoint (supports both tools/list and tools/call)
  app.post('/mcp', async (req: Request, res: Response) => {
    const correlationId = logger.generateCorrelationId();

    try {
      const mcpRequest = req.body as MCPRequest;

      if (!mcpRequest.method) {
        const response: MCPResponse = {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          error: createInvalidRequestError('Missing method'),
        };

        return res.status(400).json(response);
      }

      logger.info('Received MCP request', {
        correlationId,
        method: mcpRequest.method,
      });

      // Handle initialize method
      if (mcpRequest.method === 'initialize') {
        const response: MCPResponse = {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: {},
            },
            serverInfo: {
              name: 'mcp-openapi-gateway',
              version: '1.0.0',
            },
          },
        };

        res.json(response);
        return;
      }

      if (mcpRequest.method === 'tools/list') {
        const result = await handlers.handleToolsList();

        const response: MCPResponse = {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          result,
        };

        res.json(response);
        return;
      }

      if (mcpRequest.method === 'tools/call') {
        if (!mcpRequest.params?.name) {
          const response: MCPResponse = {
            jsonrpc: '2.0',
            id: mcpRequest.id,
            error: createInvalidRequestError('Missing tool name'),
          };

          res.status(400).json(response);
          return;
        }

        const toolName = mcpRequest.params.name;
        const args = mcpRequest.params.arguments;

        const result = await handlers.handleToolCall(toolName, args, correlationId);

        if (result.error) {
          const response: MCPResponse = {
            jsonrpc: '2.0',
            id: mcpRequest.id,
            error: result.error,
          };

          res.status(400).json(response);
          return;
        }

        const response: MCPResponse = {
          jsonrpc: '2.0',
          id: mcpRequest.id,
          result: result.response,
        };

        res.json(response);
        return;
      }

      // Method not supported
      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: mcpRequest.id,
        error: createInvalidRequestError(`Unsupported method: ${mcpRequest.method}`),
      };

      res.status(400).json(response);
      return;
    } catch (error: any) {
      logger.error('Error handling MCP request', {
        correlationId,
        error: error.message,
      });

      const response: MCPResponse = {
        jsonrpc: '2.0',
        id: req.body?.id,
        error: createInternalError(error.message),
      };

      res.status(500).json(response);
      return;
    }
  });
}

// Made with Bob
