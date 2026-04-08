import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { VERSION } from "./config.js";

// Tool registrations
import { registerSearchTools } from "./tools/search.js";
import { registerReadTools } from "./tools/read.js";
import { registerComposeTools } from "./tools/compose.js";
import { registerOrganizeTools } from "./tools/organize.js";
import { registerLabelTools } from "./tools/labels.js";
import { registerExtractTools } from "./tools/extract.js";
import { registerAttachmentTools } from "./tools/attachments.js";
import { registerProfileTools } from "./tools/profile.js";

/**
 * Create and configure the MCP server with all Gmail tools.
 */
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "gmail",
    version: VERSION,
  });

  // Register all tool groups
  registerSearchTools(server);
  registerReadTools(server);
  registerComposeTools(server);
  registerOrganizeTools(server);
  registerLabelTools(server);
  registerExtractTools(server);
  registerAttachmentTools(server);
  registerProfileTools(server);

  return server;
}

/**
 * Start the MCP server with stdio transport.
 */
export async function startServer(): Promise<void> {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
