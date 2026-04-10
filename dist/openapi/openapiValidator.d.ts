/**
 * OpenAPI specification validator
 * Validates that specs conform to OpenAPI 3.x
 */
import { OpenAPISpec } from '../config/types.js';
export declare function validateOpenAPISpec(spec: OpenAPISpec, url: string): void;
export declare function validateAllSpecs(specs: Array<{
    config: any;
    spec: OpenAPISpec;
}>): void;
//# sourceMappingURL=openapiValidator.d.ts.map