/**
 * Safe JSON parsing and stringification utilities
 */

export function safeJsonParse<T = any>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(obj: any, pretty = false): string {
  try {
    return JSON.stringify(obj, null, pretty ? 2 : 0);
  } catch {
    return String(obj);
  }
}

export function isJsonString(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// Made with Bob
