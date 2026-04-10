/**
 * MCP response formatter
 * Formats HTTP responses into MCP-compliant responses
 */

import { HTTPResponse, MCPToolResponse } from '../config/types.js';
import { safeJsonStringify } from '../utils/safeJson.js';
import * as logger from '../utils/logger.js';

export function formatMCPResponse(
  httpResponse: HTTPResponse,
  correlationId: string
): MCPToolResponse {
  const isSuccess = httpResponse.status >= 200 && httpResponse.status < 300;
  
  logger.debug('Formatting MCP response', {
    correlationId,
    status: httpResponse.status,
    isSuccess,
  });

  // Determine content type
  const contentType = httpResponse.headers['content-type'] || '';
  const isJson = contentType.includes('application/json');

  let responseText: string;

  if (isJson || typeof httpResponse.data === 'object') {
    // Format JSON response
    responseText = safeJsonStringify(httpResponse.data, true);
  } else if (typeof httpResponse.data === 'string') {
    // Use string response as-is
    responseText = httpResponse.data;
  } else {
    // Fallback for other types
    responseText = String(httpResponse.data);
  }

  // Add status information for non-2xx responses
  if (!isSuccess) {
    const statusInfo = `HTTP ${httpResponse.status} ${httpResponse.statusText}\n\n`;
    responseText = statusInfo + responseText;
  }

  return {
    content: [
      {
        type: 'text',
        text: responseText,
      },
    ],
    isError: !isSuccess,
  };
}

export function formatErrorResponse(
  error: Error,
  correlationId: string
): MCPToolResponse {
  logger.error('Formatting error response', {
    correlationId,
    error: error.message,
  });

  return {
    content: [
      {
        type: 'text',
        text: `Error: ${error.message}`,
      },
    ],
    isError: true,
  };
}

// Made with Bob
