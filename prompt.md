You are a Staff / Principal Node.js + TypeScript backend engineer.

You are given an existing prototype (`server.js`) that reads a Swagger URL and allows manual API endpoint invocation.

Your task is to **fully redesign and refactor** this prototype into a **reusable, enterprise-grade MCP OpenAPI Gateway**, suitable for internal platforms and AI agent ecosystems.

This is not a patch or cleanup — it is a **ground-up refactor guided by the provided specification**.

---

## Primary Objective

Create a **production-ready server + reusable package** that:

- Dynamically loads **one or more OpenAPI 3.x specifications**
- Converts **every API operation** into an MCP-compatible tool
- Exposes MCP-compliant endpoints:
  - `tools/list`
  - `tools/invoke`
- Routes tool invocations to real downstream HTTP APIs
- Supports **enterprise authentication**:
  - none
  - API Key
  - Bearer token
  - OAuth2 Client Credentials (Microsoft Entra ID compatible)
- Has **zero hardcoded Swagger URLs, API base URLs, or credentials**
- Is fully configurable using **environment variables only**

---

## Authoritative Inputs

You must strictly follow:

1. `server.js` (existing prototype – illustrates intent only)
2. `mcp-openapi-gateway.spec.md` (authoritative technical specification)

If there is any ambiguity, the **specification takes precedence**.

---

## Output Requirements (STRICT)

- Generate the **complete, runnable codebase**
- Do NOT omit any required file or module
- Do NOT provide partial implementations
- Do NOT include placeholder TODOs unless absolutely unavoidable
- All code must compile and run on **Node.js 18+**
- All logic must be fully implemented and production-ready

Failure to meet these requirements is considered an incorrect output.

---

## Technology & Design Constraints

- Language: **TypeScript (required)**
- Runtime: **Node.js 18+**
- HTTP Server: Express (or a lightweight equivalent)
- Configuration: **Environment variables only**
- Secrets: **Never hardcoded**
- Architecture: **Stateless**
- Logging: Structured, no secrets or tokens
- Protocol: **MCP compliance is mandatory**

---

## Required Directory Structure

Generate **exactly** the following structure (no additions or removals unless strictly necessary):