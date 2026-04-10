/**
 * No authentication provider
 */

export class NoneAuthProvider {
  async getHeaders(): Promise<Record<string, string>> {
    return {};
  }
}

// Made with Bob
