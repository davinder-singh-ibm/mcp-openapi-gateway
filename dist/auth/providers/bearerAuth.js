/**
 * Bearer token authentication provider
 */
export class BearerAuthProvider {
    bearerToken;
    constructor(bearerToken) {
        this.bearerToken = bearerToken;
    }
    async getHeaders() {
        return {
            'Authorization': `Bearer ${this.bearerToken}`,
        };
    }
}
// Made with Bob
//# sourceMappingURL=bearerAuth.js.map