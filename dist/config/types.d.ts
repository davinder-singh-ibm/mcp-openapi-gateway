/**
 * Core type definitions for MCP OpenAPI Gateway
 */
export interface GatewayConfig {
    swaggerUrls: string[];
    port: number;
    logLevel: LogLevel;
    swaggerRefreshSeconds?: number;
    swaggerTimeoutMs: number;
    allowInsecureTls: boolean;
    toolNamePrefix: string;
    serviceNameMode: ServiceNameMode;
    defaultServiceName: string;
    maxTools?: number;
}
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type ServiceNameMode = 'host' | 'title' | 'custom';
export interface AuthConfig {
    type: 'none' | 'apiKey' | 'bearer' | 'oauth2_client_credentials';
    apiKey?: string;
    apiKeyHeader?: string;
    bearerToken?: string;
    oauth2?: OAuth2Config;
}
export interface OAuth2Config {
    tokenUrl: string;
    clientId: string;
    clientSecret: string;
    scope?: string;
    resource?: string;
}
export interface SwaggerConfig {
    url: string;
    auth?: AuthConfig;
    baseUrlOverride?: string;
}
export interface OpenAPISpec {
    openapi: string;
    info: {
        title: string;
        version: string;
        description?: string;
    };
    servers?: Array<{
        url: string;
        description?: string;
    }>;
    paths: {
        [path: string]: {
            [method: string]: OpenAPIOperation;
        };
    };
    components?: {
        schemas?: Record<string, any>;
        securitySchemes?: Record<string, any>;
    };
}
export interface OpenAPIOperation {
    operationId?: string;
    summary?: string;
    description?: string;
    parameters?: OpenAPIParameter[];
    requestBody?: {
        required?: boolean;
        content?: {
            [mediaType: string]: {
                schema?: any;
            };
        };
    };
    responses?: {
        [statusCode: string]: {
            description?: string;
            content?: {
                [mediaType: string]: {
                    schema?: any;
                };
            };
        };
    };
    security?: Array<Record<string, string[]>>;
}
export interface OpenAPIParameter {
    name: string;
    in: 'path' | 'query' | 'header' | 'cookie';
    required?: boolean;
    schema?: any;
    description?: string;
}
export interface MCPTool {
    name: string;
    description: string;
    inputSchema: {
        type: 'object';
        properties: {
            path?: Record<string, any>;
            query?: Record<string, any>;
            headers?: Record<string, any>;
            body?: any;
        };
        required?: string[];
    };
}
export interface ToolMetadata {
    serviceName: string;
    baseUrl: string;
    httpMethod: string;
    path: string;
    operation: OpenAPIOperation;
    auth: AuthConfig;
}
export interface ToolInvocation {
    path?: Record<string, any>;
    query?: Record<string, any>;
    headers?: Record<string, any>;
    body?: any;
}
export interface MCPToolResponse {
    content: Array<{
        type: 'text' | 'image' | 'resource';
        text?: string;
        data?: string;
        mimeType?: string;
    }>;
    isError?: boolean;
}
export interface MCPError {
    code: number;
    message: string;
    data?: any;
}
export interface HTTPRequest {
    method: string;
    url: string;
    headers: Record<string, string>;
    data?: any;
    timeout?: number;
}
export interface HTTPResponse {
    status: number;
    statusText: string;
    headers: Record<string, string>;
    data: any;
}
export interface TokenCacheEntry {
    accessToken: string;
    expiresAt: number;
}
export interface LogContext {
    correlationId?: string;
    toolName?: string;
    method?: string;
    url?: string;
    [key: string]: any;
}
//# sourceMappingURL=types.d.ts.map