/**
 * OpenAPI specification parser
 * Extracts normalized operations and metadata from Swagger 2.0 and OpenAPI 3.x specs
 */

import {
  NormalizedMediaType,
  NormalizedParameter,
  NormalizedResponse,
  OpenAPIParameter,
  OpenAPIOperation,
  OpenAPIPathItem,
  OpenAPIReference,
  OpenAPIRequestBody,
  OpenAPIResponse,
  OpenAPISpec,
  OpenAPIVersion,
  ParsedOperation,
} from '../config/types.js';
import * as logger from '../utils/logger.js';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head', 'trace'] as const;

function isReference(value: any): value is OpenAPIReference {
  return !!value && typeof value === 'object' && typeof value.$ref === 'string';
}

function detectSpecVersion(spec: OpenAPISpec): OpenAPIVersion {
  return spec.swagger?.startsWith('2.0') ? 'swagger2' : 'openapi3';
}

function resolveLocalRef<T = any>(spec: OpenAPISpec, value: T | OpenAPIReference | undefined): T | undefined {
  if (!value) {
    return undefined;
  }

  if (!isReference(value)) {
    return value as T;
  }

  if (!value.$ref.startsWith('#/')) {
    return undefined;
  }

  const segments = value.$ref.replace(/^#\//, '').split('/');
  let current: any = spec;

  for (const segment of segments) {
    if (!current || typeof current !== 'object') {
      return undefined;
    }
    current = current[segment];
  }

  return current as T;
}

function buildSchemaFromSwaggerParameter(param: OpenAPIParameter): any {
  if (param.schema) {
    return param.schema;
  }

  const schema: any = {
    type: param.type || 'string',
  };

  if (param.description) schema.description = param.description;
  if (param.format) schema.format = param.format;
  if (param.enum) schema.enum = param.enum;
  if (param.default !== undefined) schema.default = param.default;
  if (param.example !== undefined) schema.example = param.example;
  if (param.nullable === true) schema.nullable = true;
  if (param.items) schema.items = param.items;

  return schema;
}

function normalizeParameter(param: OpenAPIParameter): NormalizedParameter {
  return {
    ...param,
    schema: buildSchemaFromSwaggerParameter(param),
    style: param.style || (param.in === 'query' ? 'form' : undefined),
    explode: param.explode ?? (param.in === 'query'),
  };
}

function dedupeParameters(params: NormalizedParameter[]): NormalizedParameter[] {
  const deduped = new Map<string, NormalizedParameter>();

  for (const param of params) {
    deduped.set(`${param.in}:${param.name}`, param);
  }

  return Array.from(deduped.values());
}

function getPreferredMediaType(content: Record<string, NormalizedMediaType>): string | undefined {
  const mediaTypes = Object.keys(content);
  if (mediaTypes.length === 0) {
    return undefined;
  }

  return (
    mediaTypes.find(type => type === 'application/json') ||
    mediaTypes.find(type => type.endsWith('+json')) ||
    mediaTypes.find(type => type === 'application/x-www-form-urlencoded') ||
    mediaTypes.find(type => type === 'multipart/form-data') ||
    mediaTypes[0]
  );
}

function normalizeRequestBody(
  spec: OpenAPISpec,
  operation: OpenAPIOperation,
  version: OpenAPIVersion
): {
  hasRequestBody: boolean;
  requestBodyRequired: boolean;
  requestBodySchema?: any;
  requestBodyContent?: Record<string, NormalizedMediaType>;
  preferredRequestContentType?: string;
} {
  if (version === 'swagger2') {
    const parameters = Array.isArray(operation.parameters)
      ? (operation.parameters as Array<OpenAPIParameter | OpenAPIReference>)
      : [];
    const resolvedParams = parameters
      .map(param => resolveLocalRef<OpenAPIParameter>(spec, param))
      .filter((param): param is OpenAPIParameter => !!param && typeof param === 'object' && 'name' in param && 'in' in param);

    const bodyParam = resolvedParams.find(param => param.in as any === 'body');
    const formParams = resolvedParams.filter(param => (param.in as any) === 'formData');

    if (bodyParam?.schema) {
      return {
        hasRequestBody: true,
        requestBodyRequired: bodyParam.required === true,
        requestBodySchema: bodyParam.schema,
        requestBodyContent: {
          'application/json': {
            mediaType: 'application/json',
            schema: bodyParam.schema,
          },
        },
        preferredRequestContentType: 'application/json',
      };
    }

    if (formParams.length > 0) {
      const schema = {
        type: 'object',
        properties: Object.fromEntries(
          formParams.map(param => [param.name, buildSchemaFromSwaggerParameter(param)])
        ),
        required: formParams.filter(param => param.required).map(param => param.name),
      };

      const preferredRequestContentType = operation.consumes?.includes('multipart/form-data')
        ? 'multipart/form-data'
        : 'application/x-www-form-urlencoded';

      return {
        hasRequestBody: true,
        requestBodyRequired: formParams.some(param => param.required === true),
        requestBodySchema: schema,
        requestBodyContent: {
          [preferredRequestContentType]: {
            mediaType: preferredRequestContentType,
            schema,
          },
        },
        preferredRequestContentType,
      };
    }

    return {
      hasRequestBody: false,
      requestBodyRequired: false,
    };
  }

  const requestBody = resolveLocalRef<OpenAPIRequestBody>(spec, operation.requestBody as OpenAPIRequestBody | OpenAPIReference | undefined);
  if (!requestBody || typeof requestBody !== 'object' || !('content' in requestBody) || !requestBody.content) {
    return {
      hasRequestBody: false,
      requestBodyRequired: false,
    };
  }

  const requestBodyContent: Record<string, NormalizedMediaType> = {};
  for (const [mediaType, media] of Object.entries(requestBody.content)) {
    requestBodyContent[mediaType] = {
      mediaType,
      schema: media?.schema,
      example: media?.example,
      encoding: media?.encoding,
    };
  }

  const preferredRequestContentType = getPreferredMediaType(requestBodyContent);

  return {
    hasRequestBody: true,
    requestBodyRequired: requestBody.required === true,
    requestBodySchema: preferredRequestContentType
      ? requestBodyContent[preferredRequestContentType]?.schema
      : undefined,
    requestBodyContent,
    preferredRequestContentType,
  };
}

function normalizeResponses(
  spec: OpenAPISpec,
  operation: OpenAPIOperation,
  version: OpenAPIVersion
): NormalizedResponse[] {
  const responses = operation.responses || {};
  const normalized: NormalizedResponse[] = [];

  for (const [statusCode, responseValue] of Object.entries(responses)) {
    const response = resolveLocalRef<OpenAPIResponse>(spec, responseValue);
    if (!response) {
      continue;
    }

    const mediaTypes: NormalizedMediaType[] = [];

    if (version === 'swagger2') {
      const produces = operation.produces || spec.produces || ['application/json'];
      if (response.schema) {
        for (const mediaType of produces) {
          mediaTypes.push({
            mediaType,
            schema: response.schema,
          });
        }
      }
    } else if (response.content) {
      for (const [mediaType, media] of Object.entries(response.content)) {
        mediaTypes.push({
          mediaType,
          schema: media?.schema,
          example: media?.example,
          encoding: media?.encoding,
        });
      }
    }

    const preferredMediaType = getPreferredMediaType(
      Object.fromEntries(mediaTypes.map(media => [media.mediaType, media]))
    );

    normalized.push({
      statusCode,
      description: response.description,
      mediaTypes,
      preferredMediaType,
      schema: preferredMediaType
        ? mediaTypes.find(media => media.mediaType === preferredMediaType)?.schema
        : undefined,
    });
  }

  return normalized.sort((a, b) => a.statusCode.localeCompare(b.statusCode));
}

function getPreferredResponse(responses: NormalizedResponse[]): NormalizedResponse | undefined {
  return (
    responses.find(response => /^2\d\d$/.test(response.statusCode)) ||
    responses.find(response => response.statusCode === 'default') ||
    responses[0]
  );
}

function collectParameters(
  spec: OpenAPISpec,
  pathItem: OpenAPIPathItem,
  operation: OpenAPIOperation
): NormalizedParameter[] {
  const pathParams = Array.isArray(pathItem.parameters) ? pathItem.parameters : [];
  const operationParams = Array.isArray(operation.parameters) ? operation.parameters : [];

  const resolved = [...pathParams, ...operationParams]
    .map(param => resolveLocalRef<OpenAPIParameter>(spec, param))
    .filter((param): param is OpenAPIParameter => !!param && typeof param === 'object' && !!param.name && !!param.in)
    .map(normalizeParameter);

  return dedupeParameters(resolved);
}

export function parseOpenAPISpec(spec: OpenAPISpec): ParsedOperation[] {
  const operations: ParsedOperation[] = [];
  const version = detectSpecVersion(spec);

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

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method] as OpenAPIOperation | undefined;

      if (!operation || typeof operation !== 'object') {
        continue;
      }

      const allParams = collectParameters(spec, pathItem, operation);
      const pathParams = allParams.filter(param => param.in === 'path');
      const queryParams = allParams.filter(param => param.in === 'query');
      const headerParams = allParams.filter(param => param.in === 'header');
      const cookieParams = allParams.filter(param => param.in === 'cookie');

      const requestBody = normalizeRequestBody(spec, operation, version);
      const responses = normalizeResponses(spec, operation, version);

      operations.push({
        path,
        method,
        operation,
        specVersion: version,
        pathParams,
        queryParams,
        headerParams,
        cookieParams,
        hasRequestBody: requestBody.hasRequestBody,
        requestBodyRequired: requestBody.requestBodyRequired,
        requestBodySchema: requestBody.requestBodySchema,
        requestBodyContent: requestBody.requestBodyContent,
        preferredRequestContentType: requestBody.preferredRequestContentType,
        responses,
        preferredResponse: getPreferredResponse(responses),
        security: operation.security,
        tags: operation.tags,
        deprecated: operation.deprecated,
      });
    }
  }

  logger.debug('Parsed OpenAPI operations', {
    title: spec.info?.title,
    version,
    operationCount: operations.length,
  });

  return operations;
}

export function resolveBaseUrl(spec: OpenAPISpec, specUrl: string, override?: string): string {
  if (override) {
    return override;
  }

  try {
    const specUrlObj = new URL(specUrl);

    if (spec.servers && spec.servers.length > 0 && spec.servers[0].url) {
      return new URL(spec.servers[0].url, specUrlObj).toString().replace(/\/$/, '');
    }

    if (spec.swagger?.startsWith('2.0')) {
      const scheme = spec.schemes?.[0] || specUrlObj.protocol.replace(':', '');
      const host = spec.host || specUrlObj.host;
      const basePath = spec.basePath || '';
      return `${scheme}://${host}${basePath}`.replace(/\/$/, '');
    }

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
        const url = new URL(resolveBaseUrl(spec, specUrl));
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
