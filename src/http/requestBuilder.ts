/**
 * HTTP request builder
 * Builds HTTP requests from tool invocations and normalized operation metadata
 */

import { HTTPRequest, NormalizedParameter, ToolInvocation, ToolMetadata } from '../config/types.js';
import { createAuthProvider, getAuthHeaders } from '../auth/authManager.js';
import * as logger from '../utils/logger.js';

function appendQueryValue(params: URLSearchParams, key: string, value: any): void {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      appendQueryValue(params, key, item);
    }
    return;
  }

  if (typeof value === 'object') {
    params.append(key, JSON.stringify(value));
    return;
  }

  params.append(key, String(value));
}

function buildQueryString(
  query: Record<string, any> | undefined,
  queryParams: NormalizedParameter[] | undefined
): string {
  if (!query || Object.keys(query).length === 0) {
    return '';
  }

  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    const paramMeta = queryParams?.find(param => param.name === key);

    if (paramMeta?.style === 'deepObject' && value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        appendQueryValue(params, `${key}[${nestedKey}]`, nestedValue);
      }
      continue;
    }

    appendQueryValue(params, key, value);
  }

  return params.toString();
}

function buildCookieHeader(
  cookies: Record<string, any> | undefined,
  cookieParams: NormalizedParameter[] | undefined
): string | undefined {
  if (!cookies || Object.keys(cookies).length === 0 || !cookieParams?.length) {
    return undefined;
  }

  const allowedCookieNames = new Set(cookieParams.map(param => param.name));
  const parts = Object.entries(cookies)
    .filter(([key, value]) => allowedCookieNames.has(key) && value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);

  return parts.length > 0 ? parts.join('; ') : undefined;
}

function buildRequestBody(invocation: ToolInvocation, metadata: ToolMetadata): any {
  if (invocation.body === undefined) {
    return undefined;
  }

  switch (metadata.requestEncoding) {
    case 'form': {
      const params = new URLSearchParams();
      if (invocation.body && typeof invocation.body === 'object' && !Array.isArray(invocation.body)) {
        for (const [key, value] of Object.entries(invocation.body)) {
          appendQueryValue(params, key, value);
        }
        return params.toString();
      }
      return String(invocation.body);
    }

    case 'text':
    case 'xml':
    case 'binary':
      return typeof invocation.body === 'string' ? invocation.body : JSON.stringify(invocation.body);

    case 'multipart':
    case 'json':
    case 'unknown':
    default:
      return invocation.body;
  }
}

export async function buildHttpRequest(
  invocation: ToolInvocation,
  metadata: ToolMetadata,
  correlationId: string
): Promise<HTTPRequest> {
  let url = metadata.baseUrl + metadata.path;

  if (invocation.path) {
    for (const [key, value] of Object.entries(invocation.path)) {
      const patterns = [`{${key}}`, `:${key}`];
      for (const pattern of patterns) {
        url = url.replace(pattern, encodeURIComponent(String(value)));
      }
    }
  }

  const queryString = buildQueryString(invocation.query, metadata.queryParams);
  if (queryString) {
    url += (url.includes('?') ? '&' : '?') + queryString;
  }

  const headers: Record<string, string> = {
    'Accept': metadata.responseContentType || 'application/json',
    'User-Agent': 'MCP-OpenAPI-Gateway/1.0',
    'X-Correlation-ID': correlationId,
  };

  if (metadata.requestContentType && metadata.requestEncoding !== 'multipart') {
    headers['Content-Type'] = metadata.requestContentType;
  }

  const authProvider = createAuthProvider(metadata.auth);
  const authHeaders = await getAuthHeaders(authProvider);
  Object.assign(headers, authHeaders);

  if (invocation.headers) {
    for (const [key, value] of Object.entries(invocation.headers)) {
      const lowerKey = key.toLowerCase();
      if (!lowerKey.includes('authorization') && !lowerKey.includes('api-key')) {
        headers[key] = String(value);
      }
    }
  }

  const cookieHeader = buildCookieHeader(invocation.headers, metadata.cookieParams);
  if (cookieHeader) {
    headers['Cookie'] = cookieHeader;
  }

  const request: HTTPRequest = {
    method: metadata.httpMethod.toUpperCase(),
    url,
    headers,
    timeout: 30000,
  };

  const body = buildRequestBody(invocation, metadata);
  if (body !== undefined) {
    request.data = body;
  }

  logger.debug('Built HTTP request', {
    correlationId,
    method: request.method,
    url: request.url,
    requestContentType: metadata.requestContentType,
    responseContentType: metadata.responseContentType,
  });

  return request;
}

// Made with Bob
