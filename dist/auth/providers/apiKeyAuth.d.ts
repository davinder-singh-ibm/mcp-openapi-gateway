/**
 * API Key authentication provider
 */
export declare class ApiKeyAuthProvider {
    private apiKey;
    private headerName;
    constructor(apiKey: string, headerName?: string);
    getHeaders(): Promise<Record<string, string>>;
}
//# sourceMappingURL=apiKeyAuth.d.ts.map