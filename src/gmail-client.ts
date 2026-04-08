import { google, gmail_v1 } from "googleapis";
import { getAuthClient } from "./auth.js";

/**
 * Get an authenticated Gmail API client instance.
 * Wraps the googleapis client with retry logic.
 */
export function getGmail(): gmail_v1.Gmail {
  return google.gmail({ version: "v1", auth: getAuthClient() });
}

/**
 * Wrapper that executes a Gmail API call with structured error handling.
 * Returns either the result or an MCP-compatible error response.
 */
export async function safeGmailCall<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const error = err as { code?: number; message?: string; errors?: unknown[] };
    const code = error.code ?? 500;
    const message = error.message ?? "Unknown Gmail API error";

    if (code === 401) {
      throw new Error(
        `Authentication expired. Run \`npx gmail-mcp-server auth\` to re-authorize.\nOriginal error: ${message}`
      );
    }
    if (code === 403) {
      throw new Error(
        `Permission denied for ${operation}. Check your OAuth scopes.\nOriginal error: ${message}`
      );
    }
    if (code === 429) {
      throw new Error(
        `Rate limited by Gmail API during ${operation}. Try again in a few seconds.\nOriginal error: ${message}`
      );
    }
    if (code === 404) {
      throw new Error(
        `Not found: ${operation}. The message or thread may have been deleted.\nOriginal error: ${message}`
      );
    }

    throw new Error(`Gmail API error during ${operation} (${code}): ${message}`);
  }
}

/**
 * Create a standardized MCP tool error response.
 */
export function toolError(message: string): { content: { type: "text"; text: string }[]; isError: true } {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

/**
 * Create a standardized MCP tool success response.
 */
export function toolSuccess(data: unknown): { content: { type: "text"; text: string }[] } {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

export function toolText(text: string): { content: { type: "text"; text: string }[] } {
  return {
    content: [{ type: "text" as const, text }],
  };
}
