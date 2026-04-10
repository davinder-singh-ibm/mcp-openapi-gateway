/**
 * Bearer token authentication provider
 */

export class BearerAuthProvider {
  constructor(private bearerToken: string) {}

  async getHeaders(): Promise<Record<string, string>> {
    return {
      'Authorization': `Bearer ${this.bearerToken}`,
    };
  }
}

// Made with Bob
