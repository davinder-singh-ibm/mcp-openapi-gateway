/**
 * Express server setup
 */
import express from 'express';
import { MCPHandlers } from '../mcp/mcpHandlers.js';
export declare function createExpressServer(handlers: MCPHandlers): express.Application;
export declare function startServer(app: express.Application, port: number): void;
//# sourceMappingURL=expressServer.d.ts.map