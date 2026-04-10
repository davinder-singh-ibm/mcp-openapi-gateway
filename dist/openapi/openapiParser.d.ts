/**
 * OpenAPI specification parser
 * Extracts operations and metadata from OpenAPI specs
 */
import { OpenAPISpec, OpenAPIOperation, OpenAPIParameter } from '../config/types.js';
export interface ParsedOperation {
    path: string;
    method: string;
    operation: OpenAPIOperation;
    pathParams: OpenAPIParameter[];
    queryParams: OpenAPIParameter[];
    headerParams: OpenAPIParameter[];
    hasRequestBody: boolean;
    requestBodySchema?: any;
}
export declare function parseOpenAPISpec(spec: OpenAPISpec): ParsedOperation[];
export declare function resolveBaseUrl(spec: OpenAPISpec, specUrl: string, override?: string): string;
export declare function getServiceName(spec: OpenAPISpec, specUrl: string, mode: 'host' | 'title' | 'custom', defaultName: string): string;
//# sourceMappingURL=openapiParser.d.ts.map