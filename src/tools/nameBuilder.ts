/**
 * Tool name builder
 * Creates deterministic, collision-safe tool names from OpenAPI operations
 */

import { ParsedOperation } from '../openapi/openapiParser.js';

export function buildToolName(
  operation: ParsedOperation,
  serviceName: string,
  prefix: string
): string {
  const parts: string[] = [];

  // Add prefix if provided
  if (prefix) {
    parts.push(prefix);
  }

  // Add service name
  parts.push(serviceName);

  // Add HTTP method
  parts.push(operation.method);

  // Normalize path
  const normalizedPath = normalizePath(operation.path, operation.pathParams.map(p => p.name));
  parts.push(normalizedPath);

  // Join with underscore and convert to lowercase
  return parts.join('_').toLowerCase();
}

function normalizePath(path: string, pathParamNames: string[]): string {
  let normalized = path;

  // Replace path parameters with _by_<param>
  for (const paramName of pathParamNames) {
    const patterns = [
      `{${paramName}}`,
      `:${paramName}`,
    ];

    for (const pattern of patterns) {
      normalized = normalized.replace(pattern, `_by_${paramName}`);
    }
  }

  // Remove leading/trailing slashes
  normalized = normalized.replace(/^\/+|\/+$/g, '');

  // Replace remaining slashes and special chars with underscores
  normalized = normalized.replace(/[\/\-\.\s]+/g, '_');

  // Remove any non-alphanumeric characters except underscores
  normalized = normalized.replace(/[^a-zA-Z0-9_]/g, '');

  // Collapse multiple underscores
  normalized = normalized.replace(/_+/g, '_');

  // Remove leading/trailing underscores
  normalized = normalized.replace(/^_+|_+$/g, '');

  return normalized;
}

export function detectNameCollisions(toolNames: string[]): Map<string, number> {
  const counts = new Map<string, number>();

  for (const name of toolNames) {
    counts.set(name, (counts.get(name) || 0) + 1);
  }

  // Return only collisions
  const collisions = new Map<string, number>();
  for (const [name, count] of counts.entries()) {
    if (count > 1) {
      collisions.set(name, count);
    }
  }

  return collisions;
}

// Made with Bob
