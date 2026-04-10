/**
 * HTTP client
 * Executes HTTP requests and handles responses
 */

import axios, { AxiosError } from 'axios';
import { HTTPRequest, HTTPResponse } from '../config/types.js';
import * as logger from '../utils/logger.js';

export async function executeHttpRequest(
  request: HTTPRequest,
  correlationId: string
): Promise<HTTPResponse> {
  logger.info('Executing HTTP request', {
    correlationId,
    method: request.method,
    url: request.url,
  });

  try {
    const response = await axios({
      method: request.method,
      url: request.url,
      headers: request.headers,
      data: request.data,
      timeout: request.timeout || 30000,
      validateStatus: () => true, // Don't throw on any status code
    });

    logger.info('HTTP request completed', {
      correlationId,
      status: response.status,
      statusText: response.statusText,
    });

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
      data: response.data,
    };
  } catch (error: any) {
    // Handle network errors, timeouts, etc.
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      logger.error('HTTP request failed', {
        correlationId,
        error: axiosError.message,
        code: axiosError.code,
      });

      // Return error as response
      return {
        status: axiosError.response?.status || 500,
        statusText: axiosError.message,
        headers: (axiosError.response?.headers as Record<string, string>) || {},
        data: {
          error: axiosError.message,
          code: axiosError.code,
        },
      };
    }

    logger.error('Unexpected error during HTTP request', {
      correlationId,
      error: error.message,
    });

    throw error;
  }
}

// Made with Bob
