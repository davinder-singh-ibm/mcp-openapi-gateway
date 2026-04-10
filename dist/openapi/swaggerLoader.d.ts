/**
 * OpenAPI/Swagger specification loader
 * Fetches and validates OpenAPI specs from URLs
 */
import { OpenAPISpec, SwaggerConfig } from '../config/types.js';
export declare function loadSwaggerSpec(config: SwaggerConfig, timeoutMs: number, allowInsecureTls: boolean): Promise<OpenAPISpec>;
export declare function loadAllSwaggerSpecs(configs: SwaggerConfig[], timeoutMs: number, allowInsecureTls: boolean): Promise<Array<{
    config: SwaggerConfig;
    spec: OpenAPISpec;
}>>;
//# sourceMappingURL=swaggerLoader.d.ts.map