/**
 * OpenAPI/Swagger specification loader
 * Fetches and validates OpenAPI specs from URLs
 */

import axios from 'axios';
import https from 'https';
import { OpenAPISpec, SwaggerConfig } from '../config/types.js';
import * as logger from '../utils/logger.js';

export async function loadSwaggerSpec(
  config: SwaggerConfig,
  timeoutMs: number,
  allowInsecureTls: boolean
): Promise<OpenAPISpec> {
  const correlationId = logger.generateCorrelationId();
  
  logger.info('Loading OpenAPI spec', {
    correlationId,
    url: config.url,
  });

  try {
    const httpsAgent = allowInsecureTls
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined;

    const response = await axios.get<OpenAPISpec>(config.url, {
      timeout: timeoutMs,
      httpsAgent,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.data) {
      throw new Error('Empty response from OpenAPI spec URL');
    }

    logger.info('Successfully loaded OpenAPI spec', {
      correlationId,
      url: config.url,
      title: response.data.info?.title,
      version: response.data.info?.version,
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to load OpenAPI spec', {
      correlationId,
      url: config.url,
      error: error.message,
    });
    throw new Error(`Failed to load OpenAPI spec from ${config.url}: ${error.message}`);
  }
}

export async function loadAllSwaggerSpecs(
  configs: SwaggerConfig[],
  timeoutMs: number,
  allowInsecureTls: boolean
): Promise<Array<{ config: SwaggerConfig; spec: OpenAPISpec }>> {
  const results = await Promise.allSettled(
    configs.map(async (config) => ({
      config,
      spec: await loadSwaggerSpec(config, timeoutMs, allowInsecureTls),
    }))
  );

  const loaded: Array<{ config: SwaggerConfig; spec: OpenAPISpec }> = [];
  const failed: string[] = [];

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === 'fulfilled') {
      loaded.push(result.value);
    } else {
      failed.push(`${configs[i].url}: ${result.reason}`);
    }
  }

  if (failed.length > 0) {
    logger.warn('Some OpenAPI specs failed to load', {
      failed,
      loaded: loaded.length,
      total: configs.length,
    });
  }

  if (loaded.length === 0) {
    throw new Error('Failed to load any OpenAPI specs');
  }

  return loaded;
}

// Made with Bob
