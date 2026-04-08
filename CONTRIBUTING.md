# Contributing to Gmail MCP Server

Thank you for your interest in contributing! This guide will help you get started.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/gmail-mcp-server.git`
3. **Install** dependencies: `npm install`
4. **Build**: `npm run build`

## Development Workflow

```bash
# Build TypeScript
npm run build

# Run the OAuth flow
npm run auth

# Start the MCP server
npm start

# Build + start in one command
npm run dev
```

## Code Style

- **TypeScript** with strict mode enabled
- **ESM** modules with `.js` extensions in imports
- **2-space** indentation
- **Zod** schemas for all tool parameter validation
- **camelCase** for variables/functions, **PascalCase** for interfaces, **snake_case** for MCP tool names

## Adding a New Tool

1. Create a new file in `src/tools/` or add to an existing file
2. Export a function that registers the tool on the MCP server
3. Use Zod schemas with `.describe()` for all parameters
4. Return responses in `{ content: [{ type: "text", text: "..." }] }` format
5. Add error handling with try/catch
6. Update `README.md` with tool documentation

## Submitting Changes

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Make your changes and ensure `npm run build` passes
3. Commit with a descriptive message: `git commit -m "feat: add get_attachment tool"`
4. Push and open a Pull Request

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `refactor:` — Code change that neither fixes a bug nor adds a feature
- `chore:` — Build process, dependency updates, etc.

## Reporting Issues

Use GitHub Issues with the provided templates. Include:
- Steps to reproduce
- Expected vs actual behavior
- Node.js version and OS
- Any error messages

## Security

**Never commit credentials or tokens.** If you accidentally expose secrets, rotate them immediately in the Google Cloud Console.
