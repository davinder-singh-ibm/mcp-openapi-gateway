/**
 * Token cache for OAuth2 access tokens
 * Thread-safe in-memory cache with expiration
 */

import { TokenCacheEntry } from '../config/types.js';
import * as logger from '../utils/logger.js';

export class TokenCache {
  private cache: Map<string, TokenCacheEntry> = new Map();
  private locks: Map<string, Promise<void>> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if token is expired (with 60 second buffer)
    const now = Date.now();
    if (entry.expiresAt <= now + 60000) {
      logger.debug('Token expired or expiring soon', {
        key,
        expiresAt: new Date(entry.expiresAt).toISOString(),
      });
      this.cache.delete(key);
      return null;
    }

    return entry.accessToken;
  }

  async set(key: string, accessToken: string, expiresInSeconds: number): Promise<void> {
    const expiresAt = Date.now() + (expiresInSeconds * 1000);

    this.cache.set(key, {
      accessToken,
      expiresAt,
    });

    logger.debug('Token cached', {
      key,
      expiresAt: new Date(expiresAt).toISOString(),
    });
  }

  async getOrRefresh(
    key: string,
    refreshFn: () => Promise<{ accessToken: string; expiresInSeconds: number }>
  ): Promise<string> {
    // Check cache first
    const cached = await this.get(key);
    if (cached) {
      return cached;
    }

    // Check if refresh is already in progress
    const existingLock = this.locks.get(key);
    if (existingLock) {
      logger.debug('Waiting for existing token refresh', { key });
      await existingLock;
      
      // Try cache again after lock is released
      const cachedAfterLock = await this.get(key);
      if (cachedAfterLock) {
        return cachedAfterLock;
      }
    }

    // Create new lock for this refresh
    const refreshPromise = this.performRefresh(key, refreshFn);
    this.locks.set(key, refreshPromise);

    try {
      await refreshPromise;
      
      // Get the newly cached token
      const newToken = await this.get(key);
      if (!newToken) {
        throw new Error('Token refresh succeeded but token not in cache');
      }
      
      return newToken;
    } finally {
      this.locks.delete(key);
    }
  }

  private async performRefresh(
    key: string,
    refreshFn: () => Promise<{ accessToken: string; expiresInSeconds: number }>
  ): Promise<void> {
    logger.info('Refreshing token', { key });

    try {
      const { accessToken, expiresInSeconds } = await refreshFn();
      await this.set(key, accessToken, expiresInSeconds);
      
      logger.info('Token refresh successful', { key });
    } catch (error: any) {
      logger.error('Token refresh failed', {
        key,
        error: error.message,
      });
      throw error;
    }
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      logger.debug('Token cleared from cache', { key });
    } else {
      this.cache.clear();
      logger.debug('All tokens cleared from cache');
    }
  }

  size(): number {
    return this.cache.size;
  }
}

// Global singleton instance
export const globalTokenCache = new TokenCache();

// Made with Bob
