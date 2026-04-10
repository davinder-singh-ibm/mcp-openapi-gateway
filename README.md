# MCP OpenAPI Gateway

Enterprise-grade gateway that dynamically converts OpenAPI 3.x specifications into MCP-compatible tools for AI agent ecosystems.

## Features

- **Dynamic Tool Generation**: Automatically converts every OpenAPI operation into an MCP tool
- **Multi-Spec Support**: Load and merge tools from multiple OpenAPI specifications
- **Enterprise Authentication**: Supports none, API Key, Bearer token, and OAuth2 Client Credentials (Microsoft Entra ID compatible)
- **Production Ready**: Stateless, fully typed TypeScript, structured logging, comprehensive error handling
- **Zero Hardcoding**: All configuration via environment variables
- **MCP Compliant**: Full support for `tools/list` and `tools/call` endpoints

## Quick Start

### Installation

```bash
npm install
```

### Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your OpenAPI spec URLs and authentication settings.

### Build

```bash
npm run build
```

### Run

```bash
npm start
```

The server will start on the configured port (default: 4000).

## Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `SWAGGER_URLS` | Comma-separated list of OpenAPI spec URLs | `https://api.example.com/swagger.json,https://api2.example.com/openapi.json` |
| `PORT` | Server port | `4000` |
| `LOG_LEVEL` | Logging level: debug, info, warn, error | `info` |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `SWAGGER_REFRESH_SECONDS` | Auto-refresh interval for specs | (disabled) |
| `SWAGGER_TIMEOUT_MS` | Timeout for fetching specs | `30000` |
| `ALLOW_INSECURE_TLS` | Allow invalid TLS certificates | `false` |
| `TOOL_NAME_PREFIX` | Prefix for all tool names | (none) |
| `SERVICE_NAME_MODE` | Service naming: host, title, custom | `title` |
| `DEFAULT_SERVICE_NAME` | Fallback service name | `api` |
| `MAX_TOOLS` | Maximum number of tools to generate | (unlimited) |

### Authentication

#### Global Authentication (applies to all specs)

**No Authentication:**
```env
AUTH_TYPE=none
```

**API Key:**
```env
AUTH_TYPE=apiKey
API_KEY=your-api-key-here
API_KEY_HEADER=x-api-key
```

**Bearer Token:**
```env
AUTH_TYPE=bearer
BEARER_TOKEN=your-bearer-token-here
```

**OAuth2 Client Credentials:**
```env
AUTH_TYPE=oauth2_client_credentials
OAUTH2_TOKEN_URL=https://login.microsoftonline.com/tenant-id/oauth2/v2.0/token
OAUTH2_CLIENT_ID=your-client-id
OAUTH2_CLIENT_SECRET=your-client-secret
OAUTH2_SCOPE=https://api.example.com/.default
OAUTH2_RESOURCE=https://api.example.com  # For Microsoft Entra ID
```

#### Per-Spec Authentication (overrides global)

Use indexed environment variables for spec-specific auth:

```env
SWAGGER_URLS=https://api1.example.com/swagger.json,https://api2.example.com/swagger.json

# Auth for first spec (index 0)
SWAGGER_0_AUTH_TYPE=apiKey
SWAGGER_0_API_KEY=key-for-api1

# Auth for second spec (index 1)
SWAGGER_1_AUTH_TYPE=bearer
SWAGGER_1_BEARER_TOKEN=token-for-api2
```

#### Base URL Override

Override the base URL for a specific spec:

```env
SWAGGER_0_BASE_URL=https://custom-base-url.example.com
```

## API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### List Tools

```bash
POST /tools/list
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "petstore_get_pets",
        "description": "List all pets",
        "inputSchema": {
          "type": "object",
          "properties": {
            "query": {
              "type": "object",
              "properties": {
                "limit": {
                  "type": "integer",
                  "description": "How many items to return"
                }
              }
            }
          }
        }
      }
    ]
  }
}
```

### Call Tool

```bash
POST /tools/call
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "petstore_get_pets",
    "arguments": {
      "query": {
        "limit": 10
      }
    }
  }
}
```

Response:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[{\"id\":1,\"name\":\"Fluffy\"}]"
      }
    ]
  }
}
```

### Generic MCP Endpoint

```bash
POST /mcp
Content-Type: application/json

{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

Supports both `tools/list` and `tools/call` methods.

## Tool Naming Convention

Tools are named using the pattern:

```
{prefix}{service_name}_{http_method}_{normalized_path}
```

Examples:
- `petstore_get_pets`
- `petstore_post_pets`
- `petstore_get_pets_by_petid`
- `api_users_get_users_by_id`

Path parameters are converted to `_by_<param>` format.

## Tool Input Schema

Each tool accepts an object with these optional properties:

```typescript
{
  "path": {        // Path parameters
    "petId": "123"
  },
  "query": {       // Query parameters
    "limit": 10
  },
  "headers": {     // Custom headers (auth headers excluded)
    "X-Custom": "value"
  },
  "body": {        // Request body (for POST/PUT/PATCH)
    "name": "Fluffy"
  }
}
```

## Error Handling

All errors follow MCP error format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32001,
    "message": "Tool not found: invalid_tool",
    "data": {}
  }
}
```

Error codes:
- `-32001`: Tool not found
- `-32002`: Tool execution error
- `-32003`: Validation error
- `-32600`: Invalid request
- `-32603`: Internal error

## Development

### Project Structure

```
src/
├── index.ts                    # Main entry point
├── config/
│   ├── env.ts                 # Environment configuration
│   └── types.ts               # Type definitions
├── openapi/
│   ├── swaggerLoader.ts       # OpenAPI spec loader
│   ├── openapiParser.ts       # OpenAPI parser
│   └── openapiValidator.ts    # OpenAPI validator
├── tools/
│   ├── toolGenerator.ts       # Tool generator
│   ├── toolRegistry.ts        # Tool registry
│   ├── schemaBuilder.ts       # JSON Schema builder
│   └── nameBuilder.ts         # Tool name builder
├── auth/
│   ├── authManager.ts         # Auth manager
│   ├── tokenCache.ts          # OAuth2 token cache
│   └── providers/
│       ├── noneAuth.ts
│       ├── apiKeyAuth.ts
│       ├── bearerAuth.ts
│       └── oauth2ClientCredentialsAuth.ts
├── http/
│   ├── httpClient.ts          # HTTP client
│   └── requestBuilder.ts      # Request builder
├── mcp/
│   ├── mcpHandlers.ts         # MCP request handlers
│   ├── mcpTypes.ts            # MCP type definitions
│   ├── mcpErrors.ts           # MCP error utilities
│   └── mcpResponseFormatter.ts # Response formatter
├── server/
│   ├── expressServer.ts       # Express server setup
│   └── routes.ts              # Route definitions
└── utils/
    ├── logger.ts              # Structured logger
    └── safeJson.ts            # JSON utilities
```

### Scripts

```bash
npm run build         # Compile TypeScript
npm start             # Run compiled server
npm run start:validate # Validate environment then start
npm run validate      # Validate environment variables only
npm run dev           # Build and run
npm run watch         # Watch mode for development
npm run clean         # Clean build artifacts
```

## Production Deployment

### Azure Web App

For Azure deployment, see:
- **[Quick Fix Guide](./AZURE_QUICK_FIX.md)** - 5-minute fix for common Azure issues
- **[Complete Azure Guide](./AZURE_DEPLOYMENT.md)** - Comprehensive deployment documentation

**Quick Azure Setup:**

1. Set environment variables in Azure Portal → Configuration → Application settings:
   ```
   SWAGGER_URLS = https://your-api.com/swagger.json
   PORT = 8080
   LOG_LEVEL = info
   ```

2. Ensure startup command is set to: `node dist/index.js`

3. Restart the Web App after configuration changes

**Common Azure Issue:** If you see "SWAGGER_URLS environment variable is required" error, see [AZURE_QUICK_FIX.md](./AZURE_QUICK_FIX.md) for immediate resolution.

### Docker Example

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]
```

### Environment Variables in Production

- Use secrets management (AWS Secrets Manager, Azure Key Vault, etc.)
- Never commit `.env` files
- Use environment-specific configurations
- Enable structured logging with appropriate log levels

## Security Considerations

- All authentication credentials are loaded from environment variables
- Secrets are never logged (automatically redacted)
- OAuth2 tokens are cached securely in memory
- TLS certificate validation is enabled by default
- Input validation using JSON Schema
- Correlation IDs for request tracing

## Troubleshooting

### Common Issues

**"Failed to load OpenAPI spec"**
- Check that SWAGGER_URLS are accessible
- Verify network connectivity
- Check TLS certificates (set ALLOW_INSECURE_TLS=true for testing only)

**"Tool name collisions detected"**
- Use operationId in your OpenAPI spec
- Adjust SERVICE_NAME_MODE or TOOL_NAME_PREFIX
- Check for duplicate operations across specs

**"OAuth2 token fetch failed"**
- Verify OAUTH2_TOKEN_URL, CLIENT_ID, and CLIENT_SECRET
- Check token endpoint accessibility
- Verify scope and resource parameters (for Entra ID)

**"Input validation failed"**
- Check tool input schema with tools/list
- Ensure all required parameters are provided
- Verify parameter types match schema

## License

MIT

## Support

For issues and questions, please open an issue on the repository.