/**
 * OAuth2 Client Credentials authentication provider
 * Supports Microsoft Entra ID (Azure AD) with resource parameter
 */

import axios from 'axios';
import { OAuth2Config } from '../../config/types.js';
import { globalTokenCache } from '../tokenCache.js';
import * as logger from '../../utils/logger.js';

export class OAuth2ClientCredentialsAuthProvider {
  private cacheKey: string;

  constructor(private config: OAuth2Config) {
    // Create unique cache key based on token URL and client ID
    this.cacheKey = `oauth2:${config.tokenUrl}:${config.clientId}`;
  }

  async getHeaders(): Promise<Record<string, string>> {
    const accessToken = await this.getAccessToken();
    
    return {
      'Authorization': `Bearer ${accessToken}`,
    };
  }

  private async getAccessToken(): Promise<string> {
    return globalTokenCache.getOrRefresh(this.cacheKey, async () => {
      return await this.fetchToken();
    });
  }

  private async fetchToken(): Promise<{ accessToken: string; expiresInSeconds: number }> {
    const correlationId = logger.generateCorrelationId();
    
    logger.info('Fetching OAuth2 access token', {
      correlationId,
      tokenUrl: this.config.tokenUrl,
      clientId: this.config.clientId,
    });

    try {
      // Build form data
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.config.clientId);
      params.append('client_secret', this.config.clientSecret);

      if (this.config.scope) {
        params.append('scope', this.config.scope);
      }

      // Microsoft Entra ID specific: resource parameter
      if (this.config.resource) {
        params.append('resource', this.config.resource);
      }

      const response = await axios.post(this.config.tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 30000,
      });

      const data = response.data;

      if (!data.access_token) {
        throw new Error('No access_token in OAuth2 response');
      }

      const expiresInSeconds = data.expires_in || 3600;

      logger.info('OAuth2 access token obtained', {
        correlationId,
        expiresIn: expiresInSeconds,
      });

      return {
        accessToken: data.access_token,
        expiresInSeconds,
      };
    } catch (error: any) {
      logger.error('Failed to fetch OAuth2 access token', {
        correlationId,
        tokenUrl: this.config.tokenUrl,
        error: error.message,
        status: error.response?.status,
      });

      throw new Error(`OAuth2 token fetch failed: ${error.message}`);
    }
  }
}

// Made with Bob
