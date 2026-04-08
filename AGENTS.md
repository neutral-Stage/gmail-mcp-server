# AGENTS.md

Guidelines for AI coding agents working in this Gmail MCP server codebase.

## Project Overview

A minimal Gmail MCP (Model Context Protocol) server that enables AI agents to interact with Gmail. Built with TypeScript and Node.js, using the official Gmail API.

## Build/Lint/Test Commands

```bash
# Install dependencies
npm install

# Build TypeScript to dist/
npm run build

# Run the compiled server
npm start

# Build and run in one command (development)
npm run dev

# Run OAuth authentication flow
npm run auth
```

**Note:** This project currently has no automated test suite or linting commands configured. Consider adding tests before making significant changes.

## Code Style Guidelines

### TypeScript Configuration

- **Target:** ES2022
- **Module:** NodeNext (ESM with Node.js resolution)
- **Strict mode:** enabled
- **Output directory:** `dist/`
- **Source directory:** `src/`

### Imports

```typescript
// Prefer ESM imports with .js extension for local files
import { something } from "./module.js";

// External imports: organize by scope (SDK, then external libs, then Node builtins)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";
import { readFileSync } from "fs";
```

- Use explicit `.js` extensions in import paths for ESM compatibility
- Group imports logically: external packages first, then Node builtins
- Destructure named imports rather than importing entire modules when possible

### Formatting

- 2-space indentation
- No semicolons required (TypeScript/ESM handles ASI)
- Max line length: ~100 characters
- Use double quotes for strings consistently
- Trailing commas in multi-line objects/arrays

### Types

- Prefer explicit types for function parameters and return values
- Use interfaces for object shapes that are reused
- Avoid `any`; use `unknown` when type is uncertain
- Leverage Zod schemas for runtime validation and type inference

```typescript
interface EmailPart {
  mimeType?: string | null;
  body?: { data?: string | null; attachmentId?: string | null; size?: number | null } | null;
  parts?: EmailPart[] | null;
  filename?: string | null;
}

function extractBody(payload: EmailPart): { text: string; html: string } {
  // ...
}
```

### Naming Conventions

- **Variables/functions:** camelCase (`getGmail`, `extractBody`, `parseHeaders`)
- **Constants:** SCREAMING_SNAKE_CASE for true constants (`TOKEN_PATH`, `SCOPES`)
- **Interfaces/types:** PascalCase (`EmailPart`, `OAuth2Client`)
- **Private helpers:** prefix with underscore if needed (`_internalHelper`)
- **MCP tool names:** snake_case (`search_emails`, `get_email`, `batch_modify_emails`)

### Error Handling

- Throw descriptive `Error` objects with actionable messages
- Include context about what failed and how to fix it

```typescript
if (!existsSync(CREDENTIALS_PATH)) {
  throw new Error(
    `credentials.json not found at ${CREDENTIALS_PATH}.\n` +
    "Download it from Google Cloud Console → APIs & Services → Credentials."
  );
}
```

- Use try/catch for async operations that may fail
- Log errors to stderr (`console.error`) not stdout
- Process exit with code 1 for fatal errors

### Async Patterns

- Use `async/await` for all async operations
- Use `Promise.all()` for parallel independent operations
- Handle promise rejections explicitly

```typescript
const summaries = await Promise.all(
  messages.map((m) =>
    gmail.users.messages.get({ userId: "me", id: m.id!, format: "metadata" })
  )
);
```

### MCP Tool Registration

Each tool follows this pattern:

```typescript
server.tool(
  "tool_name",
  "Brief description of what the tool does.",
  {
    // Zod schema for parameters
    param1: z.string().describe("Parameter description"),
    param2: z.number().int().min(1).max(100).default(20),
  },
  async ({ param1, param2 }) => {
    // Implementation
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  }
);
```

- Always use Zod for parameter validation with `.describe()` for documentation
- Return responses in `{ content: [{ type: "text", text: "..." }] }` format
- Use `JSON.stringify(data, null, 2)` for readable JSON output

### Security

- **Never commit** `credentials.json` or token files
- Tokens are stored in `~/.gmail-mcp/token.json` outside the project
- Use environment variables for configurable paths (`GMAIL_CREDENTIALS_PATH`)
- OAuth scope is limited to `gmail.modify` (no permanent delete or admin)

### File Organization

```
gmail-mcp/
├── src/
│   └── index.ts      # Main entry point (all code currently)
├── dist/             # Compiled JavaScript (gitignored)
├── credentials.json  # OAuth credentials (gitignored)
├── package.json
├── tsconfig.json
└── README.md
```

### Adding New Features

1. Add helper functions near related code (group by concern)
2. Register new MCP tools with `server.tool()`
3. Use Zod schemas for input validation
4. Return structured JSON responses
5. Update README.md with tool documentation
6. Test manually with `npm run dev`

### Gmail API Patterns

```typescript
// Get authenticated Gmail client
const gmail = google.gmail({ version: "v1", auth: getAuthClient() });

// Common operations
await gmail.users.messages.list({ userId: "me", q: query, maxResults });
await gmail.users.messages.get({ userId: "me", id, format: "full" });
await gmail.users.messages.modify({ userId: "me", id, requestBody: { addLabelIds, removeLabelIds } });
await gmail.users.messages.batchModify({ userId: "me", requestBody: { ids, addLabelIds, removeLabelIds } });
```

- Always use `userId: "me"` for authenticated user
- Respect API limits (max 100 per page for list, 1000 for batch operations)
- Use `format: "metadata"` when you only need headers, `"full"` for body content
