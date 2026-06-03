/**
 * OpenAPI specification validator
 * Validates Swagger 2.0, OpenAPI 3.0.x, and OpenAPI 3.1.x documents
 */

import { OpenAPISpec, OpenAPIVersion } from '../config/types.js';
import * as logger from '../utils/logger.js';

function detectSpecVersion(spec: OpenAPISpec): OpenAPIVersion | 'unknown' {
  if (typeof spec.swagger === 'string' && spec.swagger.startsWith('2.0')) {
    return 'swagger2';
  }

  if (typeof spec.openapi === 'string' && (spec.openapi.startsWith('3.0') || spec.openapi.startsWith('3.1'))) {
    return 'openapi3';
  }

  return 'unknown';
}

export function validateOpenAPISpec(spec: OpenAPISpec, url: string): void {
  const errors: string[] = [];
  const warnings: string[] = [];
  const version = detectSpecVersion(spec);

  if (version === 'unknown') {
    errors.push(
      `Unsupported specification version. Expected Swagger 2.0 or OpenAPI 3.x, received openapi=${spec.openapi ?? 'missing'} swagger=${spec.swagger ?? 'missing'}`
    );
  }

  if (!spec.info || typeof spec.info !== 'object') {
    errors.push('Missing info object');
  } else {
    if (!spec.info.title) {
      warnings.push('Missing info.title; service naming may fall back to defaults');
    }
    if (!spec.info.version) {
      warnings.push('Missing info.version');
    }
  }

  if (!spec.paths || typeof spec.paths !== 'object') {
    errors.push('Missing or invalid paths object');
  } else if (Object.keys(spec.paths).length === 0) {
    warnings.push('Specification has no paths defined');
  }

  if (version === 'swagger2') {
    if (spec.openapi) {
      warnings.push(`Swagger 2.0 document also contains openapi=${spec.openapi}; swagger field will be treated as authoritative`);
    }

    if (!spec.host && !spec.basePath && !spec.schemes) {
      warnings.push('Swagger 2.0 document does not define host/basePath/schemes; base URL will fall back to the spec URL origin');
    }
  }

  if (version === 'openapi3' && !spec.openapi) {
    errors.push('Missing openapi version field');
  }

  if (errors.length > 0) {
    const errorMessage = `Invalid OpenAPI spec from ${url}:\n${errors.join('\n')}`;
    logger.error('OpenAPI validation failed', {
      url,
      errors,
      warnings,
    });
    throw new Error(errorMessage);
  }

  if (warnings.length > 0) {
    logger.warn('OpenAPI validation completed with warnings', {
      url,
      version: spec.openapi || spec.swagger,
      warnings,
    });
  }

  logger.debug('OpenAPI spec validation passed', {
    url,
    version: spec.openapi || spec.swagger,
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
