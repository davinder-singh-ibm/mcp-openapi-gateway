/**
 * Environment configuration loader and validator
 */

import { GatewayConfig, LogLevel, ServiceNameMode, SwaggerConfig, AuthConfig } from './types.js';

export function loadConfig(): GatewayConfig {
  // Log available environment variables for debugging (Azure deployment)
  const envVars = Object.keys(process.env).filter(key =>
    key.startsWith('SWAGGER') ||
    key === 'PORT' ||
    key === 'LOG_LEVEL' ||
    key === 'AUTH_TYPE'
  );
  
  if (envVars.length > 0) {
    console.log('Available environment variables:', envVars);
  } else {
    console.warn('No expected environment variables found. Available vars:', Object.keys(process.env).slice(0, 10));
  }
  
  const swaggerUrlsRaw = process.env.SWAGGER_URLS;
  
  if (!swaggerUrlsRaw) {
    console.error('SWAGGER_URLS environment variable is missing');
    console.error('All environment variables:', Object.keys(process.env));
    throw new Error('SWAGGER_URLS environment variable is required');
  }

  const swaggerUrls = swaggerUrlsRaw.split(',').map(url => url.trim()).filter(url => url.length > 0);
  
  if (swaggerUrls.length === 0) {
    throw new Error('SWAGGER_URLS must contain at least one valid URL');
  }

  const port = parseInt(process.env.PORT || '4000', 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid port number (1-65535)');
  }

  const logLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
  if (!['debug', 'info', 'warn', 'error'].includes(logLevel)) {
    throw new Error('LOG_LEVEL must be one of: debug, info, warn, error');
  }

  const swaggerRefreshSeconds = process.env.SWAGGER_REFRESH_SECONDS 
    ? parseInt(process.env.SWAGGER_REFRESH_SECONDS, 10) 
    : undefined;

  const swaggerTimeoutMs = parseInt(process.env.SWAGGER_TIMEOUT_MS || '30000', 10);
  const allowInsecureTls = process.env.ALLOW_INSECURE_TLS === 'true';
  const toolNamePrefix = process.env.TOOL_NAME_PREFIX || '';
  
  const serviceNameMode = (process.env.SERVICE_NAME_MODE || 'title') as ServiceNameMode;
  if (!['host', 'title', 'custom'].includes(serviceNameMode)) {
    throw new Error('SERVICE_NAME_MODE must be one of: host, title, custom');
  }

  const defaultServiceName = process.env.DEFAULT_SERVICE_NAME || 'api';
  
  const maxTools = process.env.MAX_TOOLS 
    ? parseInt(process.env.MAX_TOOLS, 10) 
    : undefined;

  return {
    swaggerUrls,
    port,
    logLevel,
    swaggerRefreshSeconds,
    swaggerTimeoutMs,
    allowInsecureTls,
    toolNamePrefix,
    serviceNameMode,
    defaultServiceName,
    maxTools,
  };
}

export function loadSwaggerConfigs(): SwaggerConfig[] {
  const config = loadConfig();
  
  return config.swaggerUrls.map((url, index) => {
    const swaggerConfig: SwaggerConfig = {
      url,
      auth: loadAuthConfig(index),
    };

    // Check for base URL override
    const baseUrlKey = `SWAGGER_${index}_BASE_URL`;
    if (process.env[baseUrlKey]) {
      swaggerConfig.baseUrlOverride = process.env[baseUrlKey];
    }

    return swaggerConfig;
  });
}

function loadAuthConfig(index: number): AuthConfig {
  // Check for indexed auth config first
  const authTypeKey = `SWAGGER_${index}_AUTH_TYPE`;
  const authType = process.env[authTypeKey] || process.env.AUTH_TYPE || 'none';

  switch (authType) {
    case 'none':
      return { type: 'none' };

    case 'apiKey': {
      const apiKeyKey = `SWAGGER_${index}_API_KEY`;
      const apiKey = process.env[apiKeyKey] || process.env.API_KEY;
      
      if (!apiKey) {
        throw new Error(`API key required for ${authTypeKey || 'AUTH_TYPE'}=apiKey`);
      }

      const headerKey = `SWAGGER_${index}_API_KEY_HEADER`;
      const apiKeyHeader = process.env[headerKey] || process.env.API_KEY_HEADER || 'x-api-key';

      return {
        type: 'apiKey',
        apiKey,
        apiKeyHeader,
      };
    }

    case 'bearer': {
      const tokenKey = `SWAGGER_${index}_BEARER_TOKEN`;
      const bearerToken = process.env[tokenKey] || process.env.BEARER_TOKEN;
      
      if (!bearerToken) {
        throw new Error(`Bearer token required for ${authTypeKey || 'AUTH_TYPE'}=bearer`);
      }

      return {
        type: 'bearer',
        bearerToken,
      };
    }

    case 'oauth2_client_credentials': {
      const tokenUrlKey = `SWAGGER_${index}_OAUTH2_TOKEN_URL`;
      const clientIdKey = `SWAGGER_${index}_OAUTH2_CLIENT_ID`;
      const clientSecretKey = `SWAGGER_${index}_OAUTH2_CLIENT_SECRET`;
      const scopeKey = `SWAGGER_${index}_OAUTH2_SCOPE`;
      const resourceKey = `SWAGGER_${index}_OAUTH2_RESOURCE`;

      const tokenUrl = process.env[tokenUrlKey] || process.env.OAUTH2_TOKEN_URL;
      const clientId = process.env[clientIdKey] || process.env.OAUTH2_CLIENT_ID;
      const clientSecret = process.env[clientSecretKey] || process.env.OAUTH2_CLIENT_SECRET;
      const scope = process.env[scopeKey] || process.env.OAUTH2_SCOPE;
      const resource = process.env[resourceKey] || process.env.OAUTH2_RESOURCE;

      if (!tokenUrl || !clientId || !clientSecret) {
        throw new Error(
          `OAuth2 requires OAUTH2_TOKEN_URL, OAUTH2_CLIENT_ID, and OAUTH2_CLIENT_SECRET`
        );
      }

      return {
        type: 'oauth2_client_credentials',
        oauth2: {
          tokenUrl,
          clientId,
          clientSecret,
          scope,
          resource,
        },
      };
    }

    default:
      throw new Error(`Unsupported auth type: ${authType}`);
  }
}

// Made with Bob
