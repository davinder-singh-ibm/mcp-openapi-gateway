/**
 * Token cache for OAuth2 access tokens
 * Thread-safe in-memory cache with expiration
 */
export declare class TokenCache {
    private cache;
    private locks;
    get(key: string): Promise<string | null>;
    set(key: string, accessToken: string, expiresInSeconds: number): Promise<void>;
    getOrRefresh(key: string, refreshFn: () => Promise<{
        accessToken: string;
        expiresInSeconds: number;
    }>): Promise<string>;
    private performRefresh;
    clear(key?: string): void;
    size(): number;
}
export declare const globalTokenCache: TokenCache;
//# sourceMappingURL=tokenCache.d.ts.map