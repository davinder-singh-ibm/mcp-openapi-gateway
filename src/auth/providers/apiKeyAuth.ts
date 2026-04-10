/**
 * API Key authentication provider
 */

export class ApiKeyAuthProvider {
  constructor(
    private apiKey: string,
    private headerName: string = 'x-api-key'
  ) {}

  async getHeaders(): Promise<Record<string, string>> {
    return {
      [this.headerName]: this.apiKey,
    };
  }
}

// Made with Bob
