<p align="center">
  <h1 align="center">📧 Gmail MCP Server</h1>
  <p align="center">
    A powerful Gmail MCP server for AI agents — search, read, send, and organize emails via Claude Desktop, Claude Code, Cursor, and more.
  </p>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/gmail-mcp-server"><img src="https://img.shields.io/npm/v/gmail-mcp-server?color=%2300d4aa&style=flat-square" alt="npm version" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="MIT License" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%3E%3D18-brightgreen?style=flat-square" alt="Node.js >= 18" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/MCP-compatible-purple?style=flat-square" alt="MCP Compatible" /></a>
</p>

---

## ⚡ Quick Start

```bash
# One-command setup — auto-configures your AI client
npx gmail-mcp-server setup
```

That's it. The setup wizard will:
1. Check your Google OAuth credentials
2. Let you choose your AI client (Claude Desktop, Claude Code, Cursor, Windsurf)
3. Auto-write the config file
4. Run the OAuth authentication flow

---

## 🔧 Tools (20 tools)

| Category | Tool | Description |
|----------|------|-------------|
| **Search** | `search_emails` | Search with Gmail query syntax (`from:`, `is:unread`, `subject:`, etc.) |
| **Read** | `get_email` | Full email content — body, headers, attachments |
| | `get_thread` | All messages in a thread |
| **Compose** | `send_email` | Send a new email |
| | `reply_email` | Reply (or reply-all) keeping the thread |
| | `forward_email` | Forward with optional note |
| | `create_draft` | Save a draft (optionally in a thread) |
| **Organize** | `modify_email` | Add/remove labels, mark read/unread |
| | `batch_modify_emails` | Bulk modify up to 1000 emails |
| | `trash_email` | Move to trash |
| | `untrash_email` | Restore from trash |
| | `batch_trash_emails` | Bulk trash |
| | `mark_spam` | Mark as spam |
| | `advanced_filter` | Search + bulk action (archive, label, etc.) with dry-run |
| **Labels** | `list_labels` | List all labels with IDs |
| | `create_label` | Create new label (supports nesting) |
| | `delete_label` | Delete user-created label |
| **Extract** | `extract_addresses` | Extract unique addresses from search results |
| | `format_emails` | Filter, sort, reformat email data |
| **Profile** | `get_profile` | Your email address, message/thread counts |
| | `get_frequent_contacts` | Most-contacted addresses from sent mail |
| **Attachments** | `get_attachment` | Download attachment content |

---

## 📋 Prerequisites

Before running setup, you need Google OAuth credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable **Gmail API**: APIs & Services → Library → search "Gmail API" → Enable
4. Configure OAuth consent screen → External → add your email as test user
5. Create credentials: APIs & Services → Credentials → **OAuth client ID** → **Desktop app**
6. Download the JSON and save as `credentials.json`

---

## 🖥️ Client Configuration

### Claude Desktop

```bash
npx gmail-mcp-server setup   # Select "Claude Desktop"
```

Or manually add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "gmail-mcp-server"]
    }
  }
}
```

### Claude Code

```bash
npx gmail-mcp-server setup   # Select "Claude Code"
```

Or add to `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "gmail-mcp-server"]
    }
  }
}
```

### Cursor

```bash
npx gmail-mcp-server setup   # Select "Cursor"
```

Or add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "gmail": {
      "command": "npx",
      "args": ["-y", "gmail-mcp-server"]
    }
  }
}
```

### Windsurf

```bash
npx gmail-mcp-server setup   # Select "Windsurf"
```

---

## 🛠️ CLI Commands

```bash
npx gmail-mcp-server setup      # Interactive setup wizard
npx gmail-mcp-server auth       # Run OAuth flow
npx gmail-mcp-server serve      # Start MCP server (default)
npx gmail-mcp-server doctor     # Diagnose issues
npx gmail-mcp-server --help     # Show help
npx gmail-mcp-server --version  # Show version
```

---

## 💬 Usage Examples

Once configured, ask your AI agent:

- *"Search my emails for unread messages from GitHub"*
- *"Get the full content of email ID 18abc123"*
- *"Show me the whole thread for this conversation"*
- *"Reply to that email saying thanks"*
- *"Forward the invoice to accounting@company.com"*
- *"Create a draft reply for that message"*
- *"Mark all newsletters from last month as read"*
- *"Extract all email addresses from my last 50 emails"*
- *"Who do I email most frequently?"*
- *"Download the PDF attachment from that email"*

---

## 🔒 Security

- `credentials.json` — **never committed** (in `.gitignore`)
- Tokens stored in `~/.gmail-mcp/token.json` — outside the project, auto-refreshed
- OAuth scope: `gmail.modify` (read + modify, no permanent delete or admin)
- All data stays local — no external servers, no telemetry

---

## 🌍 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GMAIL_CREDENTIALS_PATH` | `./credentials.json` | Path to your OAuth credentials file |
| `GMAIL_MCP_DIR` | `process.cwd()` | Base directory for credentials lookup |

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

```bash
git clone https://github.com/sar333/gmail-mcp-server.git
cd gmail-mcp-server
npm install
npm run build
```

---

## 📄 License

[MIT](LICENSE) — use it however you want.
