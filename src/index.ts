/**
 * MCP OpenAPI Gateway - Main Entry Point
 * 
 * Enterprise-grade gateway that dynamically converts OpenAPI specifications
 * into MCP-compatible tools for AI agent ecosystems.
 */

import dotenv from 'dotenv';
import { loadConfig, loadSwaggerConfigs } from './config/env.js';
import { loadAllSwaggerSpecs } from './openapi/swaggerLoader.js';
import { validateAllSpecs } from './openapi/openapiValidator.js';
import { generateAllTools } from './tools/toolGenerator.js';
import { ToolRegistry } from './tools/toolRegistry.js';
import { MCPHandlers } from './mcp/mcpHandlers.js';
import { createExpressServer, startServer } from './server/expressServer.js';
import * as logger from './utils/logger.js';

// Load environment variables from .env file (for local development)
// In production (Azure), environment variables are injected directly
dotenv.config({ path: '.env' });

// Debug: Log if SWAGGER_URLS is available (remove in production)
if (!process.env.SWAGGER_URLS) {
  logger.error('SWAGGER_URLS not found in environment variables', {
    availableVars: Object.keys(process.env).filter(key => key.startsWith('SWAGGER') || key === 'PORT' || key === 'LOG_LEVEL')
  });
}

async function main() {
  try {
    // Load configuration
    logger.info('Loading configuration...');
    const config = loadConfig();
    logger.setLogLevel(config.logLevel);

    logger.info('Configuration loaded', {
      port: config.port,
      swaggerUrlCount: config.swaggerUrls.length,
      logLevel: config.logLevel,
      serviceNameMode: config.serviceNameMode,
    });

    // Load Swagger configurations
    const swaggerConfigs = loadSwaggerConfigs();

    // Load all OpenAPI specs
    logger.info('Loading OpenAPI specifications...');
    const loadedSpecs = await loadAllSwaggerSpecs(
      swaggerConfigs,
      config.swaggerTimeoutMs,
      config.allowInsecureTls
    );

    logger.info('OpenAPI specifications loaded', {
      count: loadedSpecs.length,
    });

    // Validate all specs
    logger.info('Validating OpenAPI specifications...');
    validateAllSpecs(loadedSpecs);
    logger.info('All OpenAPI specifications validated successfully');

    // Generate tools from all specs
    logger.info('Generating MCP tools...');
    const generatedTools = generateAllTools(
      loadedSpecs,
      config.toolNamePrefix,
      config.serviceNameMode,
      config.defaultServiceName,
      config.maxTools
    );

    logger.info('MCP tools generated', {
      toolCount: generatedTools.length,
    });

    // Create tool registry
    const registry = new ToolRegistry(generatedTools);

    // Log tool summary
    const serviceNames = registry.getServiceNames();
    logger.info('Tool registry initialized', {
      totalTools: registry.getToolCount(),
      services: serviceNames,
      toolsPerService: serviceNames.map(name => ({
        service: name,
        count: registry.getToolsByService(name).length,
      })),
    });

    // Create MCP handlers
    const handlers = new MCPHandlers(registry);

    // Create and start Express server
    const app = createExpressServer(handlers);
    startServer(app, config.port);

    // Setup periodic refresh if configured
    if (config.swaggerRefreshSeconds) {
      logger.info('Periodic spec refresh enabled', {
        intervalSeconds: config.swaggerRefreshSeconds,
      });

      setInterval(async () => {
        try {
          logger.info('Refreshing OpenAPI specifications...');
          const refreshedSpecs = await loadAllSwaggerSpecs(
            swaggerConfigs,
            config.swaggerTimeoutMs,
            config.allowInsecureTls
          );
          validateAllSpecs(refreshedSpecs);
          
          const refreshedTools = generateAllTools(
            refreshedSpecs,
            config.toolNamePrefix,
            config.serviceNameMode,
            config.defaultServiceName,
            config.maxTools
          );

          // Update registry (would need to implement registry update method)
          logger.info('OpenAPI specifications refreshed', {
            toolCount: refreshedTools.length,
          });
        } catch (error: any) {
          logger.error('Failed to refresh OpenAPI specifications', {
            error: error.message,
          });
        }
      }, config.swaggerRefreshSeconds * 1000);
    }

  } catch (error: any) {
    logger.error('Fatal error during startup', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled rejection', {
    reason: reason?.message || String(reason),
    stack: reason?.stack,
  });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the application
main();

// Made with Bob
