/**
 * OpenAPI/Swagger specification loader
 * Fetches JSON or YAML specs from URLs and parses them into objects
 */

import axios from 'axios';
import https from 'https';
import YAML from 'yaml';
import { OpenAPISpec, SwaggerConfig } from '../config/types.js';
import * as logger from '../utils/logger.js';

function parseSpecDocument(raw: unknown, contentType?: string): OpenAPISpec {
  if (raw && typeof raw === 'object') {
    return raw as OpenAPISpec;
  }

  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error('Empty or unsupported OpenAPI document');
  }

  const trimmed = raw.trim();
  const normalizedContentType = (contentType || '').toLowerCase();

  const looksLikeJson =
    normalizedContentType.includes('json') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('[');

  if (looksLikeJson) {
    return JSON.parse(trimmed) as OpenAPISpec;
  }

  return YAML.parse(trimmed) as OpenAPISpec;
}

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

    const response = await axios.get(config.url, {
      timeout: timeoutMs,
      httpsAgent,
      responseType: 'text',
      transformResponse: [(data) => data],
      headers: {
        'Accept': 'application/json, application/yaml, application/x-yaml, text/yaml, text/x-yaml, text/plain, */*',
      },
    });

    const spec = parseSpecDocument(response.data, response.headers['content-type']);

    if (!spec || typeof spec !== 'object') {
      throw new Error('Parsed OpenAPI document is not an object');
    }

    logger.info('Successfully loaded OpenAPI spec', {
      correlationId,
      url: config.url,
      title: spec.info?.title,
      version: spec.openapi || spec.swagger || spec.info?.version,
      contentType: response.headers['content-type'],
    });

    return spec;
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
