/**
 * JSON Schema builder for MCP tool input schemas
 * Converts OpenAPI parameters and request bodies to JSON Schema
 */

import { ParsedOperation } from '../openapi/openapiParser.js';
import { OpenAPIParameter, OpenAPISpec } from '../config/types.js';

/**
 * Dereference a schema by resolving all $ref references
 */
function dereferenceSchema(schema: any, spec: OpenAPISpec, visited = new Set<string>()): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  // Handle $ref
  if (schema.$ref && typeof schema.$ref === 'string') {
    const ref = schema.$ref;
    
    // Prevent circular references
    if (visited.has(ref)) {
      return { type: 'object', description: 'Circular reference detected' };
    }
    visited.add(ref);

    // Parse the reference path (e.g., "#/components/schemas/SubscriberRequestDto")
    const refPath = ref.replace(/^#\//, '').split('/');
    
    // Navigate to the referenced schema
    let resolved: any = spec;
    for (const segment of refPath) {
      if (resolved && typeof resolved === 'object') {
        resolved = resolved[segment];
      } else {
        // Reference not found, return a generic object schema
        return { type: 'object', description: `Unresolved reference: ${ref}` };
      }
    }

    // Recursively dereference the resolved schema
    return dereferenceSchema(resolved, spec, visited);
  }

  // Handle arrays
  if (Array.isArray(schema)) {
    return schema.map(item => dereferenceSchema(item, spec, visited));
  }

  // Handle objects - recursively dereference all properties
  const dereferenced: any = {};
  for (const [key, value] of Object.entries(schema)) {
    dereferenced[key] = dereferenceSchema(value, spec, visited);
  }

  return dereferenced;
}

export function buildToolInputSchema(operation: ParsedOperation, spec: OpenAPISpec): any {
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

  // Build request body schema with dereferencing
  if (operation.hasRequestBody && operation.requestBodySchema) {
    properties.body = dereferenceSchema(operation.requestBodySchema, spec);
    
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
