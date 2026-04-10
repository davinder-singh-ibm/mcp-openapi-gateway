/**
 * Authentication manager
 * Creates and manages authentication providers
 */
import { AuthConfig } from '../config/types.js';
import { NoneAuthProvider } from './providers/noneAuth.js';
import { ApiKeyAuthProvider } from './providers/apiKeyAuth.js';
import { BearerAuthProvider } from './providers/bearerAuth.js';
import { OAuth2ClientCredentialsAuthProvider } from './providers/oauth2ClientCredentialsAuth.js';
export type AuthProvider = NoneAuthProvider | ApiKeyAuthProvider | BearerAuthProvider | OAuth2ClientCredentialsAuthProvider;
export declare function createAuthProvider(config: AuthConfig): AuthProvider;
export declare function getAuthHeaders(provider: AuthProvider): Promise<Record<string, string>>;
//# sourceMappingURL=authManager.d.ts.map