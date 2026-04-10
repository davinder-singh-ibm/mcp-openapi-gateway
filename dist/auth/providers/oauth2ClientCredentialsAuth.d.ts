/**
 * OAuth2 Client Credentials authentication provider
 * Supports Microsoft Entra ID (Azure AD) with resource parameter
 */
import { OAuth2Config } from '../../config/types.js';
export declare class OAuth2ClientCredentialsAuthProvider {
    private config;
    private cacheKey;
    constructor(config: OAuth2Config);
    getHeaders(): Promise<Record<string, string>>;
    private getAccessToken;
    private fetchToken;
}
//# sourceMappingURL=oauth2ClientCredentialsAuth.d.ts.map