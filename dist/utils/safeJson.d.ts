/**
 * Safe JSON parsing and stringification utilities
 */
export declare function safeJsonParse<T = any>(json: string, fallback: T): T;
export declare function safeJsonStringify(obj: any, pretty?: boolean): string;
export declare function isJsonString(str: string): boolean;
//# sourceMappingURL=safeJson.d.ts.map