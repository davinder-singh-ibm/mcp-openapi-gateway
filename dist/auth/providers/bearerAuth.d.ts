/**
 * Bearer token authentication provider
 */
export declare class BearerAuthProvider {
    private bearerToken;
    constructor(bearerToken: string);
    getHeaders(): Promise<Record<string, string>>;
}
//# sourceMappingURL=bearerAuth.d.ts.map