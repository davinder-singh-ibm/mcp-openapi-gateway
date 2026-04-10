/**
 * OpenAPI specification parser
 * Extracts operations and metadata from OpenAPI specs
 */

import { OpenAPISpec, OpenAPIOperation, OpenAPIParameter } from '../config/types.js';
import * as logger from '../utils/logger.js';

export interface ParsedOperation {
  path: string;
  method: string;
  operation: OpenAPIOperation;
  pathParams: OpenAPIParameter[];
  queryParams: OpenAPIParameter[];
  headerParams: OpenAPIParameter[];
  hasRequestBody: boolean;
  requestBodySchema?: any;
}

export function parseOpenAPISpec(spec: OpenAPISpec): ParsedOperation[] {
  const operations: ParsedOperation[] = [];

  if (!spec.paths) {
    logger.warn('OpenAPI spec has no paths', {
      title: spec.info?.title,
    });
    return operations;
  }

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem || typeof pathItem !== 'object') {
      continue;
    }

    const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
    
    for (const method of methods) {
      const operation = pathItem[method] as OpenAPIOperation | undefined;
      
      if (!operation) {
        continue;
      }

      const pathParams: OpenAPIParameter[] = [];
      const queryParams: OpenAPIParameter[] = [];
      const headerParams: OpenAPIParameter[] = [];

      // Parse parameters
      const allParams: OpenAPIParameter[] = [
        ...(Array.isArray(pathItem.parameters) ? pathItem.parameters : []),
        ...(Array.isArray(operation.parameters) ? operation.parameters : []),
      ];

      for (const param of allParams) {
        if (!param || typeof param !== 'object') {
          continue;
        }

        switch (param.in) {
          case 'path':
            pathParams.push(param);
            break;
          case 'query':
            queryParams.push(param);
            break;
          case 'header':
            headerParams.push(param);
            break;
        }
      }

      // Parse request body
      let hasRequestBody = false;
      let requestBodySchema: any = undefined;

      if (operation.requestBody) {
        hasRequestBody = true;
        const content = operation.requestBody.content;
        
        if (content) {
          // Prefer application/json
          if (content['application/json']?.schema) {
            requestBodySchema = content['application/json'].schema;
          } else {
            // Fallback to first available content type
            const firstContentType = Object.keys(content)[0];
            if (firstContentType && content[firstContentType]?.schema) {
              requestBodySchema = content[firstContentType].schema;
            }
          }
        }
      }

      operations.push({
        path,
        method,
        operation,
        pathParams,
        queryParams,
        headerParams,
        hasRequestBody,
        requestBodySchema,
      });
    }
  }

  logger.debug('Parsed OpenAPI operations', {
    title: spec.info?.title,
    operationCount: operations.length,
  });

  return operations;
}

export function resolveBaseUrl(spec: OpenAPISpec, specUrl: string, override?: string): string {
  // 1. Use override if provided
  if (override) {
    return override;
  }

  // 2. Use servers[0].url if present
  if (spec.servers && spec.servers.length > 0 && spec.servers[0].url) {
    const serverUrl = spec.servers[0].url;
    
    // If it's a relative URL, resolve against spec URL
    if (serverUrl.startsWith('/')) {
      const specUrlObj = new URL(specUrl);
      return `${specUrlObj.protocol}//${specUrlObj.host}${serverUrl}`;
    }
    
    return serverUrl;
  }

  // 3. Derive from spec URL origin
  try {
    const specUrlObj = new URL(specUrl);
    return `${specUrlObj.protocol}//${specUrlObj.host}`;
  } catch {
    throw new Error(`Cannot resolve base URL for spec: ${specUrl}`);
  }
}

export function getServiceName(
  spec: OpenAPISpec,
  specUrl: string,
  mode: 'host' | 'title' | 'custom',
  defaultName: string
): string {
  switch (mode) {
    case 'title':
      return spec.info?.title || defaultName;
    
    case 'host':
      try {
        const url = new URL(specUrl);
        return url.hostname.replace(/\./g, '_');
      } catch {
        return defaultName;
      }
    
    case 'custom':
    default:
      return defaultName;
  }
}

// Made with Bob
