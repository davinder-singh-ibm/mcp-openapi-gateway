/**
 * Express server setup
 */

import express from 'express';
import { MCPHandlers } from '../mcp/mcpHandlers.js';
import { setupRoutes } from './routes.js';
import * as logger from '../utils/logger.js';

export function createExpressServer(handlers: MCPHandlers): express.Application {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP request', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
      });
    });

    next();
  });

  // Setup routes
  setupRoutes(app, handlers);

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      path: req.path,
    });
  });

  // Error handler
  app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Express error handler', {
      error: err.message,
      stack: err.stack,
      path: req.path,
    });

    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
  });

  return app;
}

export function startServer(app: express.Application, port: number): void {
  app.listen(port, () => {
    logger.info('MCP OpenAPI Gateway started', {
      port,
      endpoints: {
        health: `http://localhost:${port}/health`,
        toolsList: `http://localhost:${port}/tools/list`,
        toolsCall: `http://localhost:${port}/tools/call`,
        mcp: `http://localhost:${port}/mcp`,
      },
    });
  });
}

// Made with Bob
