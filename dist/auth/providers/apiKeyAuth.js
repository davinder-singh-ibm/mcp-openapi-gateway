/**
 * API Key authentication provider
 */
export class ApiKeyAuthProvider {
    apiKey;
    headerName;
    constructor(apiKey, headerName = 'x-api-key') {
        this.apiKey = apiKey;
        this.headerName = headerName;
    }
    async getHeaders() {
        return {
            [this.headerName]: this.apiKey,
        };
    }
}
// Made with Bob
//# sourceMappingURL=apiKeyAuth.js.map