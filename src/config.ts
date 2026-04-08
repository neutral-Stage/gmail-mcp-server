import { homedir } from "os";
import { join } from "path";

// ─── Paths ──────────────────────────────────────────────────────────────────────

export const TOKEN_DIR = join(homedir(), ".gmail-mcp");
export const TOKEN_PATH = join(TOKEN_DIR, "token.json");

export const CREDENTIALS_PATH =
  process.env.GMAIL_CREDENTIALS_PATH ??
  join(process.env.GMAIL_MCP_DIR ?? process.cwd(), "credentials.json");

// ─── OAuth Scopes ───────────────────────────────────────────────────────────────

export const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];

// ─── Package info ───────────────────────────────────────────────────────────────

export const PACKAGE_NAME = "gmail-mcp-server";
export const VERSION = "2.0.0";

// ─── Client config paths ───────────────────────────────────────────────────────

export function getClaudeDesktopConfigPath(): string {
  const platform = process.platform;
  if (platform === "darwin") {
    return join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  } else if (platform === "win32") {
    return join(process.env.APPDATA ?? join(homedir(), "AppData", "Roaming"), "Claude", "claude_desktop_config.json");
  } else {
    return join(homedir(), ".config", "claude", "claude_desktop_config.json");
  }
}

export function getClaudeCodeConfigPath(global = false): string {
  if (global) {
    return join(homedir(), ".claude", "mcp.json");
  }
  return join(process.cwd(), ".mcp.json");
}

export function getCursorConfigPath(): string {
  return join(process.cwd(), ".cursor", "mcp.json");
}

export function getWindsurfConfigPath(): string {
  return join(homedir(), ".codeium", "windsurf", "mcp_config.json");
}
