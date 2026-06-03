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
export type OpenAPIVersion = 'swagger2' | 'openapi3';
export type ParameterLocation = 'path' | 'query' | 'header' | 'cookie';
export type QueryStyle =
  | 'form'
  | 'spaceDelimited'
  | 'pipeDelimited'
  | 'deepObject'
  | 'simple'
  | 'label'
  | 'matrix';
export type RequestEncoding =
  | 'json'
  | 'form'
  | 'multipart'
  | 'text'
  | 'binary'
  | 'xml'
  | 'unknown';

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
  resource?: string; // For Microsoft Entra ID
}

export interface SwaggerConfig {
  url: string;
  auth?: AuthConfig;
  baseUrlOverride?: string;
}

export interface OpenAPIReference {
  $ref: string;
}

export interface OpenAPIMediaTypeObject {
  schema?: any;
  example?: any;
  examples?: Record<string, any>;
  encoding?: Record<string, any>;
}

export interface OpenAPIRequestBody {
  required?: boolean;
  description?: string;
  content?: Record<string, OpenAPIMediaTypeObject>;
}

export interface OpenAPIResponse {
  description?: string;
  schema?: any;
  headers?: Record<string, any>;
  content?: Record<string, OpenAPIMediaTypeObject>;
}

export interface OpenAPIParameter {
  name: string;
  in: ParameterLocation;
  required?: boolean;
  schema?: any;
  description?: string;
  type?: string;
  format?: string;
  enum?: any[];
  items?: any;
  default?: any;
  nullable?: boolean;
  style?: QueryStyle;
  explode?: boolean;
  collectionFormat?: 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi';
  allowEmptyValue?: boolean;
  example?: any;
  examples?: Record<string, any>;
}

export interface OpenAPIOperation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
  consumes?: string[];
  produces?: string[];
  parameters?: Array<OpenAPIParameter | OpenAPIReference>;
  requestBody?: OpenAPIRequestBody | OpenAPIReference;
  responses?: Record<string, OpenAPIResponse | OpenAPIReference>;
  security?: Array<Record<string, string[]>>;
}

export interface OpenAPIPathItem {
  $ref?: string;
  parameters?: Array<OpenAPIParameter | OpenAPIReference>;
  get?: OpenAPIOperation;
  put?: OpenAPIOperation;
  post?: OpenAPIOperation;
  delete?: OpenAPIOperation;
  options?: OpenAPIOperation;
  head?: OpenAPIOperation;
  patch?: OpenAPIOperation;
  trace?: OpenAPIOperation;
  [method: string]: any;
}

export interface OpenAPISpec {
  openapi?: string;
  swagger?: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
    variables?: Record<string, { default?: string; enum?: string[]; description?: string }>;
  }>;
  host?: string;
  basePath?: string;
  schemes?: string[];
  consumes?: string[];
  produces?: string[];
  paths: Record<string, OpenAPIPathItem>;
  components?: {
    schemas?: Record<string, any>;
    parameters?: Record<string, OpenAPIParameter | OpenAPIReference>;
    responses?: Record<string, OpenAPIResponse | OpenAPIReference>;
    requestBodies?: Record<string, OpenAPIRequestBody | OpenAPIReference>;
    securitySchemes?: Record<string, any>;
  };
  definitions?: Record<string, any>;
  parameters?: Record<string, OpenAPIParameter | OpenAPIReference>;
  responses?: Record<string, OpenAPIResponse | OpenAPIReference>;
  securityDefinitions?: Record<string, any>;
}

export interface NormalizedMediaType {
  mediaType: string;
  schema?: any;
  example?: any;
  encoding?: Record<string, any>;
}

export interface NormalizedParameter extends OpenAPIParameter {
  schema: any;
  style?: QueryStyle;
  explode?: boolean;
}

export interface NormalizedResponse {
  statusCode: string;
  description?: string;
  mediaTypes: NormalizedMediaType[];
  preferredMediaType?: string;
  schema?: any;
}

export interface ParsedOperation {
  path: string;
  method: string;
  operation: OpenAPIOperation;
  specVersion: OpenAPIVersion;
  pathParams: NormalizedParameter[];
  queryParams: NormalizedParameter[];
  headerParams: NormalizedParameter[];
  cookieParams: NormalizedParameter[];
  hasRequestBody: boolean;
  requestBodyRequired: boolean;
  requestBodySchema?: any;
  requestBodyContent?: Record<string, NormalizedMediaType>;
  preferredRequestContentType?: string;
  responses: NormalizedResponse[];
  preferredResponse?: NormalizedResponse;
  security?: Array<Record<string, string[]>>;
  tags?: string[];
  deprecated?: boolean;
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
  outputSchema?: any;
  annotations?: Record<string, any>;
}

export interface ToolMetadata {
  serviceName: string;
  baseUrl: string;
  httpMethod: string;
  path: string;
  operation: OpenAPIOperation;
  auth: AuthConfig;
  requestContentType?: string;
  responseContentType?: string;
  requestEncoding?: RequestEncoding;
  queryParams?: NormalizedParameter[];
  headerParams?: NormalizedParameter[];
  cookieParams?: NormalizedParameter[];
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

// Made with Bob
