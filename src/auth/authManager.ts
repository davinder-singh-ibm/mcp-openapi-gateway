/**
 * Authentication manager
 * Creates and manages authentication providers
 */

import { AuthConfig } from '../config/types.js';
import { NoneAuthProvider } from './providers/noneAuth.js';
import { ApiKeyAuthProvider } from './providers/apiKeyAuth.js';
import { BearerAuthProvider } from './providers/bearerAuth.js';
import { OAuth2ClientCredentialsAuthProvider } from './providers/oauth2ClientCredentialsAuth.js';

export type AuthProvider = 
  | NoneAuthProvider 
  | ApiKeyAuthProvider 
  | BearerAuthProvider 
  | OAuth2ClientCredentialsAuthProvider;

export function createAuthProvider(config: AuthConfig): AuthProvider {
  switch (config.type) {
    case 'none':
      return new NoneAuthProvider();

    case 'apiKey':
      if (!config.apiKey) {
        throw new Error('API key is required for apiKey auth type');
      }
      return new ApiKeyAuthProvider(config.apiKey, config.apiKeyHeader);

    case 'bearer':
      if (!config.bearerToken) {
        throw new Error('Bearer token is required for bearer auth type');
      }
      return new BearerAuthProvider(config.bearerToken);

    case 'oauth2_client_credentials':
      if (!config.oauth2) {
        throw new Error('OAuth2 config is required for oauth2_client_credentials auth type');
      }
      return new OAuth2ClientCredentialsAuthProvider(config.oauth2);

    default:
      throw new Error(`Unsupported auth type: ${(config as any).type}`);
  }
}

export async function getAuthHeaders(provider: AuthProvider): Promise<Record<string, string>> {
  return await provider.getHeaders();
}

// Made with Bob
