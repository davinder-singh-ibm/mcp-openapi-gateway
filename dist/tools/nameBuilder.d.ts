/**
 * Tool name builder
 * Creates deterministic, collision-safe tool names from OpenAPI operations
 */
import { ParsedOperation } from '../openapi/openapiParser.js';
export declare function buildToolName(operation: ParsedOperation, serviceName: string, prefix: string): string;
export declare function detectNameCollisions(toolNames: string[]): Map<string, number>;
//# sourceMappingURL=nameBuilder.d.ts.map