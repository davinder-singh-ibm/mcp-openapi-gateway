/**
 * Safe JSON parsing and stringification utilities
 */
export function safeJsonParse(json, fallback) {
    try {
        return JSON.parse(json);
    }
    catch {
        return fallback;
    }
}
export function safeJsonStringify(obj, pretty = false) {
    try {
        return JSON.stringify(obj, null, pretty ? 2 : 0);
    }
    catch {
        return String(obj);
    }
}
export function isJsonString(str) {
    try {
        JSON.parse(str);
        return true;
    }
    catch {
        return false;
    }
}
// Made with Bob
//# sourceMappingURL=safeJson.js.map