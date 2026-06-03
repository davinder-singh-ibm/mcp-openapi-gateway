/**
 * JSON Schema builder for MCP tool input schemas
 * Converts normalized OpenAPI parameters and request bodies to agent-friendly JSON Schema
 */

import { NormalizedParameter, OpenAPISpec, ParsedOperation } from '../config/types.js';

function resolveLocalRef(spec: OpenAPISpec, ref: string): any {
  if (!ref.startsWith('#/')) {
    return {
      type: 'object',
      description: `External reference not resolved inline: ${ref}`,
    };
  }

  const segments = ref.replace(/^#\//, '').split('/');
  let current: any = spec;

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return {
        type: 'object',
        description: `Unresolved reference: ${ref}`,
      };
    }
    current = current[segment];
  }

  return current;
}

function normalizeNullable(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return schema;
  }

  const normalized = { ...schema };

  if (normalized.nullable === true && typeof normalized.type === 'string') {
    normalized.type = [normalized.type, 'null'];
    delete normalized.nullable;
  }

  if (Array.isArray(normalized.type) && !normalized.type.includes('null') && normalized.nullable === true) {
    normalized.type = [...normalized.type, 'null'];
    delete normalized.nullable;
  }

  return normalized;
}

function mergeAllOf(parts: any[]): any {
  const merged: any = {
    type: 'object',
    properties: {},
    required: [],
  };

  for (const part of parts) {
    if (!part || typeof part !== 'object') {
      continue;
    }

    if (part.type && part.type !== 'object') {
      merged.type = part.type;
    }

    if (part.description && !merged.description) {
      merged.description = part.description;
    }

    if (part.properties && typeof part.properties === 'object') {
      merged.properties = {
        ...merged.properties,
        ...part.properties,
      };
    }

    if (Array.isArray(part.required)) {
      merged.required = Array.from(new Set([...(merged.required || []), ...part.required]));
    }

    for (const [key, value] of Object.entries(part)) {
      if (['type', 'properties', 'required', 'description'].includes(key)) {
        continue;
      }
      if (merged[key] === undefined) {
        merged[key] = value;
      }
    }
  }

  if (!merged.required?.length) {
    delete merged.required;
  }

  if (!Object.keys(merged.properties || {}).length) {
    delete merged.properties;
  }

  return merged;
}

function normalizeSchema(
  schema: any,
  spec: OpenAPISpec,
  stack: string[] = []
): any {
  if (schema === null || schema === undefined) {
    return { type: 'string' };
  }

  if (typeof schema !== 'object') {
    return schema;
  }

  if (schema.$ref && typeof schema.$ref === 'string') {
    const ref = schema.$ref;
    if (stack.includes(ref)) {
      return {
        type: 'object',
        description: `Recursive reference: ${ref}`,
      };
    }

    const resolved = resolveLocalRef(spec, ref);
    return normalizeSchema(resolved, spec, [...stack, ref]);
  }

  if (Array.isArray(schema)) {
    return schema.map(item => normalizeSchema(item, spec, stack));
  }

  const normalized = normalizeNullable({ ...schema });

  if (normalized.allOf && Array.isArray(normalized.allOf)) {
    const merged = mergeAllOf(normalized.allOf.map((part: any) => normalizeSchema(part, spec, stack)));
    const remainder = { ...normalized };
    delete remainder.allOf;
    return normalizeSchema({ ...merged, ...remainder }, spec, stack);
  }

  if (normalized.oneOf && Array.isArray(normalized.oneOf)) {
    normalized.oneOf = normalized.oneOf.map((part: any) => normalizeSchema(part, spec, stack));
    normalized.description = normalized.description || 'Provide a value matching one of the allowed schemas';
  }

  if (normalized.anyOf && Array.isArray(normalized.anyOf)) {
    normalized.anyOf = normalized.anyOf.map((part: any) => normalizeSchema(part, spec, stack));
    normalized.description = normalized.description || 'Provide a value matching any compatible schema';
  }

  if (normalized.properties && typeof normalized.properties === 'object') {
    normalized.type = normalized.type || 'object';
    normalized.properties = Object.fromEntries(
      Object.entries(normalized.properties).map(([key, value]) => [key, normalizeSchema(value, spec, stack)])
    );
  }

  if (normalized.items) {
    normalized.items = normalizeSchema(normalized.items, spec, stack);
    normalized.type = normalized.type || 'array';
  }

  if (normalized.additionalProperties && typeof normalized.additionalProperties === 'object') {
    normalized.additionalProperties = normalizeSchema(normalized.additionalProperties, spec, stack);
  }

  if (!normalized.type && normalized.properties) {
    normalized.type = 'object';
  }

  if (!normalized.type && normalized.enum) {
    normalized.type = typeof normalized.enum[0] === 'number' ? 'number' : 'string';
  }

  return normalized;
}

function buildParametersSchema(params: NormalizedParameter[], spec: OpenAPISpec): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  for (const param of params) {
    if (!param.name) {
      continue;
    }

    const schema = normalizeSchema(param.schema, spec);
    if (param.description && !schema.description) {
      schema.description = param.description;
    }
    if (param.example !== undefined && schema.example === undefined) {
      schema.example = param.example;
    }
    if (param.default !== undefined && schema.default === undefined) {
      schema.default = param.default;
    }

    properties[param.name] = schema;

    if (param.required === true) {
      required.push(param.name);
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
    additionalProperties: false,
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

export function buildToolInputSchema(operation: ParsedOperation, spec: OpenAPISpec): any {
  const properties: Record<string, any> = {};
  const required: string[] = [];

  if (operation.pathParams.length > 0) {
    properties.path = buildParametersSchema(operation.pathParams, spec);
    if (operation.pathParams.some(p => p.required !== false)) {
      required.push('path');
    }
  }

  if (operation.queryParams.length > 0) {
    properties.query = buildParametersSchema(operation.queryParams, spec);
    if (operation.queryParams.some(p => p.required === true)) {
      required.push('query');
    }
  }

  const nonAuthHeaders = operation.headerParams.filter(h => !isAuthHeader(h.name));
  if (nonAuthHeaders.length > 0) {
    properties.headers = buildParametersSchema(nonAuthHeaders, spec);
    if (nonAuthHeaders.some(p => p.required === true)) {
      required.push('headers');
    }
  }

  if (operation.hasRequestBody && operation.requestBodySchema) {
    properties.body = normalizeSchema(operation.requestBodySchema, spec);
    if (operation.requestBodyRequired) {
      required.push('body');
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
    additionalProperties: false,
  };
}

export function buildToolDescription(operation: ParsedOperation): string {
  const baseDescription =
    operation.operation.summary ||
    operation.operation.description ||
    `${operation.method.toUpperCase()} ${operation.path}`;

  const hints: string[] = [];

  if (operation.queryParams.length > 0) {
    hints.push(`query params: ${operation.queryParams.map(param => param.name).join(', ')}`);
  }

  if (operation.hasRequestBody && operation.preferredRequestContentType) {
    hints.push(`body: ${operation.preferredRequestContentType}`);
  }

  if (operation.preferredResponse?.statusCode) {
    hints.push(`success: ${operation.preferredResponse.statusCode}`);
  }

  const suffix = hints.length > 0 ? ` (${hints.join(' | ')})` : '';
  const description = `${baseDescription}${suffix}`;

  return description.length > 300 ? `${description.substring(0, 297)}...` : description;
}

export function buildToolOutputSchema(operation: ParsedOperation, spec: OpenAPISpec): any | undefined {
  if (!operation.preferredResponse?.schema) {
    return undefined;
  }

  return normalizeSchema(operation.preferredResponse.schema, spec);
}

// Made with Bob
