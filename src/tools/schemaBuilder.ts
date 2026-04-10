/**
 * JSON Schema builder for MCP tool input schemas
 * Converts OpenAPI parameters and request bodies to JSON Schema
 */

import { ParsedOperation } from '../openapi/openapiParser.js';
import { OpenAPIParameter } from '../config/types.js';

export function buildToolInputSchema(operation: ParsedOperation): any {
  const properties: any = {};
  const required: string[] = [];

  // Build path parameters schema
  if (operation.pathParams.length > 0) {
    properties.path = buildParametersSchema(operation.pathParams);
    
    // Path params are always required
    if (operation.pathParams.some(p => p.required !== false)) {
      required.push('path');
    }
  }

  // Build query parameters schema
  if (operation.queryParams.length > 0) {
    properties.query = buildParametersSchema(operation.queryParams);
    
    if (operation.queryParams.some(p => p.required === true)) {
      required.push('query');
    }
  }

  // Build header parameters schema (excluding auth headers)
  const nonAuthHeaders = operation.headerParams.filter(
    h => !isAuthHeader(h.name)
  );
  
  if (nonAuthHeaders.length > 0) {
    properties.headers = buildParametersSchema(nonAuthHeaders);
    
    if (nonAuthHeaders.some(p => p.required === true)) {
      required.push('headers');
    }
  }

  // Build request body schema
  if (operation.hasRequestBody && operation.requestBodySchema) {
    properties.body = operation.requestBodySchema;
    
    if (operation.operation.requestBody?.required === true) {
      required.push('body');
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

function buildParametersSchema(params: OpenAPIParameter[]): any {
  const properties: any = {};
  const required: string[] = [];

  for (const param of params) {
    if (!param.name) {
      continue;
    }

    // Use the parameter's schema if available, otherwise create a basic one
    properties[param.name] = param.schema || {
      type: 'string',
      description: param.description,
    };

    if (param.required === true) {
      required.push(param.name);
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

function isAuthHeader(headerName: string): boolean {
  const authHeaders = [
    'authorization',
    'x-api-key',
    'api-key',
    'apikey',
  ];

  return authHeaders.includes(headerName.toLowerCase());
}

export function buildToolDescription(operation: ParsedOperation): string {
  // Prefer summary, fallback to description, then generate from method and path
  if (operation.operation.summary) {
    return operation.operation.summary;
  }

  if (operation.operation.description) {
    // Truncate long descriptions
    const desc = operation.operation.description;
    return desc.length > 200 ? desc.substring(0, 197) + '...' : desc;
  }

  // Generate default description
  return `${operation.method.toUpperCase()} ${operation.path}`;
}

// Made with Bob
