```markdown
# MCP OpenAPI Gateway – Technical Specification
## Reusable MCP Tools Server

---

## 1. Purpose / Goal

Build a reusable Node.js / TypeScript gateway server that dynamically converts one or more OpenAPI (Swagger) specifications into **MCP-compatible tools**.

The gateway must allow any MCP-capable AI agent to:
- Discover available API operations as MCP tools
- Invoke those tools using validated JSON Schema inputs
- Receive standardized MCP-compliant responses and errors

The system must work with **any valid OpenAPI 3.x specification** without code changes and must be suitable for enterprise deployment.

---

## 2. Primary Use Case

Given one or more OpenAPI / Swagger specification URLs, the server must:
- Download and validate specs at startup
- Normalize operations across multiple services
- Generate MCP tools dynamically (one tool per operation)
- Expose MCP endpoints:
  - `tools/list`
  - `tools/invoke`
- Route invocations to downstream HTTP APIs with correct authentication

---

## 3. Supported OpenAPI Formats

### Required
- OpenAPI 3.0.x and 3.1.x (JSON)
- HTTP methods: GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD
- Parameters:
  - path
  - query
  - header
- requestBody:
  - application/json
- responses:
  - application/json
  - text/plain

### Optional (Feature-Flagged)
- YAML specifications
- multipart/form-data
- content negotiation via Accept header

---

## 4. Configuration Inputs

### Required Environment Variables

| Name | Description |
|----|----|
| SWAGGER_URLS | Comma-separated list of OpenAPI spec URLs |
| PORT | Server port (default: 4000) |
| LOG_LEVEL | debug / info / warn / error |

### Optional Environment Variables

| Name | Description |
|----|----|
| SWAGGER_REFRESH_SECONDS | Periodically re-fetch specs |
| SWAGGER_TIMEOUT_MS | Timeout for fetching specs |
| ALLOW_INSECURE_TLS | Allow invalid TLS certificates |
| TOOL_NAME_PREFIX | Prefix for all tools |
| SERVICE_NAME_MODE | host \| title \| custom |
| DEFAULT_SERVICE_NAME | Fallback service name |
| MAX_TOOLS | Hard cap on generated tools |

---

## 5. Base URL Resolution Rules

For each OpenAPI spec:
1. Use `servers[0].url` if present
2. Otherwise derive from the Swagger URL origin
3. Allow environment override per service
4. Resolve once at load time

---

## 6. Authentication System (Pluggable)

### Supported Strategies
- none
- apiKey
- bearer
- oauth2_client_credentials (Microsoft Entra ID compatible)

### Rules
- Auth may be global or per Swagger URL
- Auth must be injected in the HTTP client layer
- MCP tool schemas must never expose auth fields
- Secrets and tokens must never be logged

### OAuth2 Client Credentials
- Supports token_url, client_id, client_secret
- Supports scope and resource (Entra)
- Caches access_token in memory
- Refreshes automatically with mutex protection
- Fails tool invocation safely on auth failure

---

## 7. Tool Generation Rules

- Exactly one MCP tool per OpenAPI operation
- Deterministic, collision-safe naming

Default format:
```

{toolPrefix}{serviceName}*{httpMethod}*{normalizedPath}

````

Rules:
- snake_case, lowercase
- Path params become `_by_<param>`
- Collisions must fail fast or resolve deterministically

---

## 8. Tool Input Schema

Each MCP tool input schema:

```json
{
  "path": {},
  "query": {},
  "headers": {},
  "body": {}
}
````

Rules:

*   Required parameters enforced
*   Auth headers excluded
*   requestBody maps to body
*   Schema must be valid JSON Schema (2020-12)

***

## 9. MCP Behavior

### tools/list

*   Lists all tools with name, description, schema

### tools/invoke

Must:

*   Validate tool existence
*   Validate input schema
*   Build request URL
*   Inject authentication
*   Execute HTTP call
*   Normalize success and errors to MCP format

***

## 10. Error Handling

*   HTTP errors mapped to MCP errors
*   Validation errors explicit
*   Downstream status preserved
*   No secrets in logs or errors

***

## 11. Non-Functional Requirements

*   Stateless server
*   Node.js 18+
*   Strict TypeScript
*   Modular design
*   Structured logging with correlationId
*   Fail fast on invalid specs

***

## 12. Out of Scope

*   UI
*   Manual endpoint selection
*   API mutation beyond OpenAPI definitions

````

```markdown
You are a Staff / Principal Node.js + TypeScript backend engineer.

You are given an existing prototype (`server.js`) that reads a Swagger URL and allows manual endpoint invocation.

Your task is to redesign and refactor this prototype into a reusable, enterprise-grade **MCP OpenAPI Gateway**.

---

## Primary Objective

Create a production-ready **server + reusable package** that:
- Dynamically loads one or more OpenAPI 3.x specifications
- Converts every API operation into an MCP tool
- Exposes MCP-compliant `tools/list` and `tools/invoke` endpoints
- Routes tool invocations to downstream HTTP APIs
- Supports enterprise authentication (Bearer, API key, OAuth2 / Entra ID)
- Has zero hardcoded URLs, API endpoints, or secrets

---

## Provided Inputs

- Existing prototype: `server.js`
- Authoritative specification: `mcp-openapi-gateway.spec.md`

---

## Output Requirements (Strict)

- Generate the **complete runnable codebase**
- No partial implementations
- No missing modules
- No placeholder TODOs unless unavoidable
- Must build and run on Node.js 18+

---

## Technology Constraints

- Language: TypeScript (required)
- Runtime: Node.js 18+
- Server: Express (or equivalent lightweight HTTP framework)
- Configuration: environment variables only
- No secrets in code
- Stateless design
- Full MCP protocol compliance

---

## Required Directory Structure

Generate **exactly** the following structure:

````

src/
index.ts
server/
expressServer.ts
routes.ts
config/
env.ts
types.ts
openapi/
swaggerLoader.ts
openapiParser.ts
openapiValidator.ts
tools/
toolGenerator.ts
toolRegistry.ts
schemaBuilder.ts
nameBuilder.ts
auth/
authManager.ts
providers/
noneAuth.ts
apiKeyAuth.ts
bearerAuth.ts
oauth2ClientCredentialsAuth.ts
tokenCache.ts
http/
httpClient.ts
requestBuilder.ts
mcp/
mcpHandlers.ts
mcpTypes.ts
mcpErrors.ts
mcpResponseFormatter.ts
utils/
logger.ts
safeJson.ts
package.json
tsconfig.json
README.md
.env.example

```

---

## Functional Requirements

### OpenAPI Handling
- Load multiple specs from `SWAGGER_URLS`
- Validate OpenAPI 3.x
- Resolve base URLs correctly
- Merge tools safely
- Fail fast on validation errors

### MCP Tooling
- One tool per OpenAPI operation
- Deterministic, collision-safe naming
- JSON Schema input validation
- Strict MCP `tools/list` and `tools/invoke`

### Authentication
- Pluggable providers:
  - none
  - apiKey
  - bearer
  - oauth2 client credentials (Entra-compatible)
- Token caching and auto-refresh
- Auth injected transparently into HTTP calls

### Observability
- Structured logs
- Correlation ID per invocation
- No secrets logged

---

## Testing Expectation

If full tests are too large:
- Include test scaffolding
- Provide example unit tests for:
  - Tool naming
  - Schema generation
  - Request building

---

## Documentation

Generate `README.md` with:
- Setup instructions
- Environment variables
- Example Swagger usage
- Sample `tools/list` response
- Sample `tools/invoke` request/response

---

## Output Format (MANDATORY)

- No explanations before code
- Output file-by-file
- Each file preceded by its relative path heading:

Example:

sample use case:

Retrieve subscriber details by phone number 8800226877

```

### src/index.ts

<code>
```

Failure to follow structure, completeness, or formatting rules is considered an incorrect output.

```
```
