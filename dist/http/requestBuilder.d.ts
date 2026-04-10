/**
 * HTTP request builder
 * Builds HTTP requests from tool invocations and metadata
 */
import { ToolInvocation, ToolMetadata, HTTPRequest } from '../config/types.js';
export declare function buildHttpRequest(invocation: ToolInvocation, metadata: ToolMetadata, correlationId: string): Promise<HTTPRequest>;
//# sourceMappingURL=requestBuilder.d.ts.map