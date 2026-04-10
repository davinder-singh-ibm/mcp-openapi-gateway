/**
 * MCP protocol type definitions
 */

export interface MCPRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: MCPErrorObject;
}

export interface MCPErrorObject {
  code: number;
  message: string;
  data?: any;
}

export interface MCPToolsListRequest {
  method: 'tools/list';
  params?: {
    cursor?: string;
  };
}

export interface MCPToolsListResponse {
  tools: Array<{
    name: string;
    description: string;
    inputSchema: any;
  }>;
  nextCursor?: string;
}

export interface MCPCallToolRequest {
  method: 'tools/call';
  params: {
    name: string;
    arguments?: any;
  };
}

export interface MCPCallToolResponse {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

// MCP Error Codes
export const MCP_ERROR_CODES = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  TOOL_NOT_FOUND: -32001,
  TOOL_EXECUTION_ERROR: -32002,
  VALIDATION_ERROR: -32003,
} as const;

// Made with Bob
