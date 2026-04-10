/**
 * HTTP request builder
 * Builds HTTP requests from tool invocations and metadata
 */

import { ToolInvocation, ToolMetadata, HTTPRequest } from '../config/types.js';
import { createAuthProvider, getAuthHeaders } from '../auth/authManager.js';
import * as logger from '../utils/logger.js';

export async function buildHttpRequest(
  invocation: ToolInvocation,
  metadata: ToolMetadata,
  correlationId: string
): Promise<HTTPRequest> {
  // Build URL with path parameters
  let url = metadata.baseUrl + metadata.path;

  // Replace path parameters
  if (invocation.path) {
    for (const [key, value] of Object.entries(invocation.path)) {
      const patterns = [`{${key}}`, `:${key}`];
      for (const pattern of patterns) {
        url = url.replace(pattern, encodeURIComponent(String(value)));
      }
    }
  }

  // Add query parameters
  if (invocation.query && Object.keys(invocation.query).length > 0) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(invocation.query)) {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    }
    const queryString = params.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'MCP-OpenAPI-Gateway/1.0',
    'X-Correlation-ID': correlationId,
  };

  // Add authentication headers
  const authProvider = createAuthProvider(metadata.auth);
  const authHeaders = await getAuthHeaders(authProvider);
  Object.assign(headers, authHeaders);

  // Add custom headers from invocation (excluding auth headers)
  if (invocation.headers) {
    for (const [key, value] of Object.entries(invocation.headers)) {
      const lowerKey = key.toLowerCase();
      if (!lowerKey.includes('authorization') && !lowerKey.includes('api-key')) {
        headers[key] = String(value);
      }
    }
  }

  const request: HTTPRequest = {
    method: metadata.httpMethod.toUpperCase(),
    url,
    headers,
    timeout: 30000,
  };

  // Add body for non-GET requests
  if (invocation.body && metadata.httpMethod !== 'get') {
    request.data = invocation.body;
  }

  logger.debug('Built HTTP request', {
    correlationId,
    method: request.method,
    url: request.url,
  });

  return request;
}

// Made with Bob
