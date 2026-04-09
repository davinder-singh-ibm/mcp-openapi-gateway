import dotenv from "dotenv";
import axios from "axios";
import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  isInitializeRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, ".env") }); //

const API_BASE = process.env.API_BASE_URL;
const SWAGGER_PATH = process.env.SWAGGER_PATH;
const SWAGGER_URL = `${API_BASE}${SWAGGER_PATH}`;
const API_KEY = process.env.API_KEY;
const PORT = Number(process.env.PORT || 8080);

if (!API_BASE || !SWAGGER_PATH || !API_KEY) {
  console.error("Missing required environment variables:");
  console.error(`API_BASE_URL: ${API_BASE || "NOT SET"}`);
  console.error(`SWAGGER_PATH: ${SWAGGER_PATH || "NOT SET"}`);
  console.error(`API_KEY: ${API_KEY || "NOT SET"}`);
  console.error("\nPlease check your .env file in the project root.");
  process.exit(1);
}

console.log(`Loaded config: API_BASE=${API_BASE}, SWAGGER_URL=${SWAGGER_URL}`);

async function loadSwagger() {
  const res = await axios.get(SWAGGER_URL);
  return res.data;
}

function swaggerToTools(swagger) {
  const tools = [];

  for (const [path, methods] of Object.entries(swagger.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!path.startsWith("/api")) continue;

      const toolName =
        operation.operationId || `${method}_${path.replace(/\W+/g, "_")}`;

      tools.push({
        name: toolName,
        description: operation.summary || `Call ${method.toUpperCase()} ${path}`,
        inputSchema: {
          type: "object",
          properties: {
            body: {
              type: "object",
              description: "Request payload",
            },
          },
          required: method !== "get" ? ["body"] : [],
        },
      });
    }
  }

  return tools;
}

function createToolHandlers(swagger) {
  const handlers = {};

  for (const [path, methods] of Object.entries(swagger.paths ?? {})) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!path.startsWith("/api")) continue;

      const toolName =
        operation.operationId || `${method}_${path.replace(/\W+/g, "_")}`;

      handlers[toolName] = async ({ body } = {}) => {
        const response = await axios({
          method,
          url: `${API_BASE}${path}`,
          headers: {
            "x-api-key": API_KEY,
            "Content-Type": "application/json",
          },
          data: body,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      };
    }
  }

  return handlers;
}

async function createServer() {
  const swagger = await loadSwagger();
  const tools = swaggerToTools(swagger);
  const handlers = createToolHandlers(swagger);

  const server = new Server(
    {
      name: "express-mcp-demo",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = handlers[name];

    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    return await handler(args);
  });

  return server;
}

const transports = {};
const app = createMcpExpressApp({ host: "0.0.0.0" });

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    swaggerUrl: SWAGGER_URL,
  });
});

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];

  try {
    let transport;

    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
      await transport.handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          transports[newSessionId] = transport;
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && transports[sid]) {
          delete transports[sid];
        }
      };

      const server = await createServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: No valid session ID provided",
      },
      id: null,
    });
  } catch (error) {
    console.error("Error handling MCP POST request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  try {
    await transports[sessionId].handleRequest(req, res);
  } catch (error) {
    console.error("Error handling MCP GET request:", error);
    if (!res.headersSent) {
      res.status(500).send("Internal server error");
    }
  }
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"];

  if (!sessionId || !transports[sessionId]) {
    res.status(400).send("Invalid or missing session ID");
    return;
  }

  try {
    await transports[sessionId].handleRequest(req, res);
  } catch (error) {
    console.error("Error handling MCP DELETE request:", error);
    if (!res.headersSent) {
      res.status(500).send("Internal server error");
    }
  }
});

app.listen(PORT, () => {
  console.log(`MCP HTTP server listening on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
});
