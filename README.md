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

## ✨ Why choose this MCP?

While Google provides workspace integrations and generic email readers exist, this MCP is explicitly built for **AI Agents acting autonomously**:

- **Zero-Config Setup**: `npx gmail-mcp-server setup` detects your OS and AI client, automatically editing your local configuration JSON. No manual path mapping required.
- **Built for AI Agents**: Includes tools like `advanced_filter` (search + bulk actions with LLM-friendly dry-runs), `batch_modify_emails` (modify 1000 emails at once), and `get_frequent_contacts` (turn an inbox into a CRM context).
- **100% Local & Private**: Bring-your-own-credentials. Tokens remain strictly on your machine. No proxy servers, no telemetry, and no third-party email routing.
- **Modular & Extensible**: Clean, deeply typed domain-driven structure (e.g., `src/tools/compose.ts`, `src/tools/search.ts`) making it extremely easy for developers to fork and extend.

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

## 🚀 Step-by-Step Setup Guide

Follow these steps to get your Gmail MCP server running in less than 5 minutes.

### 1. Create Google Cloud Project & Enable API
1.  Open the [Google Cloud Console](https://console.cloud.google.com/).
2.  **Create a New Project**: Click the project dropdown (top left) → "New Project" → Name it `Gmail MCP` → "Create".
3.  **Enable Gmail API**: Search for "Gmail API" in the search bar → Click it → Click **Enable**.

### 2. Configure OAuth Consent Screen
1.  Go to **APIs & Services** → **OAuth consent screen**.
2.  Select **User Type**: "External" (or "Internal" if you have a Google Workspace) → Click **Create**.
3.  **App Information**: Fill in "App name" (e.g., `Gmail MCP`) and "User support email".
4.  **Developer Contact**: Fill in your email address.
5.  Click **Save and Continue** until you reach the **Summary**.
6.  **Add Test Users**: Go back to the "OAuth consent screen" tab → Under "Test users" → Click **+ ADD USERS** → Enter your Gmail address → Click **Save**.

### 3. Generate Credentials
1.  Go to **APIs & Services** → **Credentials**.
2.  Click **+ CREATE CREDENTIALS** → Select **OAuth client ID**.
3.  **Application type**: Select **Desktop app**.
4.  **Name**: Give it a name (e.g., `Gmail MCP Client`).
5.  Click **Create**.
6.  **Download JSON**: In the "OAuth 2.0 Client IDs" list, click the download icon (↓) for your new client.
7.  **Rename & Move**: Save this file as `credentials.json` in your project folder (or keep it ready for the setup wizard).

### 4. Run the Setup Wizard
Open your terminal and run:
```bash
npx gmail-mcp-server setup
```
The wizard will guide you through:
-   Finding your `credentials.json`.
-   Selecting your AI client (Claude, Cursor, etc.).
-   Authorizing the app via your browser.

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

## 🩺 Troubleshooting

If you run into issues, try the following:

1.  **Run the Doctor**: `npx gmail-mcp-server doctor` will diagnose common problems with your credentials, tokens, and system.
2.  **Missing `credentials.json`**: Ensure you've downloaded the file from Google Cloud Console and it's named exactly `credentials.json` in your current directory.
3.  **Invalid Grant / Expired Token**: If the server can't connect, try running `npx gmail-mcp-server auth` to reset your OAuth tokens.
4.  **Port 3000 Busy**: The auth flow uses port 3000. If it's busy, the flow might fail. Ensure no other apps are using port 3000 during setup.

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
