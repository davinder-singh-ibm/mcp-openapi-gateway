/**
 * OpenAPI specification validator
 * Validates that specs conform to OpenAPI 3.x
 */

import { OpenAPISpec } from '../config/types.js';
import * as logger from '../utils/logger.js';

export function validateOpenAPISpec(spec: OpenAPISpec, url: string): void {
  const errors: string[] = [];

  // Check OpenAPI version
  if (!spec.openapi) {
    errors.push('Missing openapi version field');
  } else if (!spec.openapi.startsWith('3.0') && !spec.openapi.startsWith('3.1')) {
    errors.push(`Unsupported OpenAPI version: ${spec.openapi}. Only 3.0.x and 3.1.x are supported`);
  }

  // Check info object
  if (!spec.info) {
    errors.push('Missing info object');
  } else {
    if (!spec.info.title) {
      errors.push('Missing info.title');
    }
    if (!spec.info.version) {
      errors.push('Missing info.version');
    }
  }

  // Check paths
  if (!spec.paths || typeof spec.paths !== 'object') {
    errors.push('Missing or invalid paths object');
  } else if (Object.keys(spec.paths).length === 0) {
    logger.warn('OpenAPI spec has no paths defined', { url });
  }

  if (errors.length > 0) {
    const errorMessage = `Invalid OpenAPI spec from ${url}:\n${errors.join('\n')}`;
    logger.error('OpenAPI validation failed', {
      url,
      errors,
    });
    throw new Error(errorMessage);
  }

  logger.debug('OpenAPI spec validation passed', {
    url,
    version: spec.openapi,
    title: spec.info?.title,
  });
}

export function validateAllSpecs(
  specs: Array<{ config: any; spec: OpenAPISpec }>
): void {
  for (const { config, spec } of specs) {
    validateOpenAPISpec(spec, config.url);
  }
}

// Made with Bob
